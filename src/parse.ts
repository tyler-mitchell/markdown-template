import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { getText, type CstNode } from "monogram/src/gen-parser.ts";
import { parser } from "./grammar.ts";

export type Syntax = {
  source: string;
  tree: CstNode;
};
export type Expression = Syntax & { kind: "expression"; offset: number; end: number };
export type Escape = { kind: "escape"; offset: number; end: number; value: string };
type Inline = Expression | Escape;
export type Element = Syntax & {
  kind: "element";
  name: string;
  offset: number;
  end: number;
  bodyOffset: number;
  bodyEnd: number;
  indent: number;
  bodyIndent: number;
  children: Part[];
};
export type Part = Inline | Element;

/** Follows Markdoc's findTagEnd scanner, accounting for expression braces. */
function findEnd(source: string, terminator: "}" | ">"): number {
  const state = { mode: "normal", braces: 0 };
  for (const [offset, character] of source.split("").entries()) {
    switch (state.mode) {
      case "escape":
        state.mode = "string";
        break;
      case "string":
        if (character === '"') state.mode = "normal";
        if (character === "\\") state.mode = "escape";
        break;
      default:
        if (character === '"') state.mode = "string";
        if (character === "{") state.braces++;
        if (character === "}") state.braces--;
        if (character === terminator && state.braces === 0) return offset + 1;
    }
  }
  return source.length;
}

export const markdown = new MarkdownIt({ html: true });
type Container = { element: Element; closingLine?: number };
type BlockEnvironment = { containers: Container[]; children: Part[] };
type InlineEnvironment = { offset: number; inlines: Inline[] };
const inline = new MarkdownIt("zero");
inline.inline.ruler.enable(["escape", "newline"]);

inline.inline.ruler.before("escape", "mdt_escape", (state, silent) => {
  const source = state.src.slice(state.pos, state.pos + 2);
  if (source !== "\\{" && source !== "\\}") return false;
  if (!silent) {
    const { offset, inlines } = state.env as InlineEnvironment;
    inlines.push({
      kind: "escape",
      offset: offset + state.pos,
      end: offset + state.pos + 2,
      value: source[1],
    });
  }
  state.pos += 2;
  return true;
});

inline.inline.ruler.before("text", "mdt_expression", (state, silent) => {
  if (state.src[state.pos] !== "{") return false;
  const rest = state.src.slice(state.pos, state.posMax);
  const source = rest.slice(0, findEnd(rest, "}"));
  const syntax = { source, tree: parser.parse(source, "Interpolation") };
  if (!silent) {
    const { offset, inlines } = state.env as InlineEnvironment;
    inlines.push({
      ...syntax,
      kind: "expression",
      offset: offset + state.pos,
      end: offset + state.pos + source.length,
    } satisfies Expression);
  }
  state.pos += syntax.source.length;
  return true;
});

markdown.block.ruler.before(
  "code",
  "mdt_tag",
  (state, start, end, silent) => {
    const rest = state.src.slice(state.bMarks[start] + state.tShift[start]);
    const control = rest.startsWith("<$") || rest.startsWith("</$");
    if (!control) return false;
    const source = rest.slice(0, findEnd(rest, ">"));
    if (rest.slice(source.length).split("\n", 1)[0].trim()) return false;
    if (silent) return true;
    const tree = parser.parse(source, "Tag");
    const closing = source.startsWith("</");
    const nesting = source.endsWith("/>") ? 0 : 1;
    const token = state.push("mdt_tag", getText(tree.children[1], source), closing ? -1 : nesting);
    const lines = source.split("\n").length;
    token.map = [start, start + lines];
    token.meta = { source, tree } satisfies Syntax;
    state.line = start + lines;
    const { containers, children } = state.env as BlockEnvironment;
    const parent = containers.at(-1);
    if (closing && parent) {
      if (parent.element.name !== token.tag)
        throw new SyntaxError(`Unexpected closing tag: ${token.tag}`);
      parent.element.bodyEnd = state.bMarks[start];
      parent.element.end = state.bMarks[state.line] ?? state.src.length;
      const body = new markdown.block.State(
        state.src.slice(parent.element.bodyOffset, parent.element.bodyEnd),
        markdown,
        {},
        [],
      );
      const indents = body.sCount.slice(0, body.lineMax).filter((_, line) => !body.isEmpty(line));
      parent.element.bodyIndent = indents.length ? Math.min(...indents) : 0;
      parent.closingLine = state.line;
      state.line = end;
    } else if (closing) {
      throw new SyntaxError(`Unexpected closing tag: ${token.tag}`);
    } else {
      const bodyOffset = state.bMarks[state.line] ?? state.src.length;
      const element: Element = {
        kind: "element",
        name: token.tag,
        source,
        tree,
        offset: state.bMarks[start],
        end: bodyOffset,
        bodyOffset,
        bodyEnd: bodyOffset,
        indent: state.sCount[start],
        bodyIndent: 0,
        children: [],
      };
      (parent?.element.children ?? children).push(element);
      if (nesting === 0) return true;
      const container: Container = { element };
      const indent = state.blkIndent;
      containers.push(container);
      state.blkIndent = state.sCount[start];
      while (state.line < end && container.closingLine === undefined) {
        state.blkIndent = Math.min(
          state.blkIndent,
          state.sCount[state.skipEmptyLines(state.line)] ?? indent,
        );
        state.md.block.tokenize(state, state.line, end);
      }
      state.blkIndent = indent;
      containers.pop();
      if (container.closingLine === undefined) throw new SyntaxError(`Unclosed tag: ${token.tag}`);
      state.line = container.closingLine;
    }
    return true;
  },
  { alt: ["paragraph", "reference", "blockquote"] },
);

/** Markdown owns prose and code; Monogram owns embedded document syntax. */
export function parse(source: string) {
  const { data: frontmatter, content } = matter(source);
  const children: Part[] = [];
  const tokens: ReturnType<typeof markdown.parse> = [];
  markdown.block.parse(
    content,
    markdown,
    { containers: [], children } satisfies BlockEnvironment,
    tokens,
  );
  const lines = new markdown.block.State(content, markdown, {}, []);
  const inlines: Inline[] = [];
  for (const token of tokens) {
    if (!["inline", "fence", "code_block", "tr_open"].includes(token.type) || !token.map) continue;
    const offset = lines.bMarks[token.map[0]];
    const end = lines.bMarks[token.map[1]] ?? content.length;
    inline.inline.parse(
      content.slice(offset, end),
      inline,
      { offset, inlines } satisfies InlineEnvironment,
      [],
    );
  }
  function insert(parts: Part[], inline: Inline) {
    const parent = parts.find(
      (part): part is Element =>
        part.kind === "element" && inline.offset >= part.bodyOffset && inline.end <= part.bodyEnd,
    );
    if (parent) insert(parent.children, inline);
    else parts.push(inline);
  }
  for (const inline of inlines) insert(children, inline);
  function order(parts: Part[]) {
    parts.sort((left, right) => left.offset - right.offset);
    for (const part of parts) if (part.kind === "element") order(part.children);
  }
  order(children);
  return { source, content, frontmatter, tokens, children };
}
