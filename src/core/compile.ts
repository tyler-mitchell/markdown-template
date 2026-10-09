import { type, type Module, type Type } from "#arktype";
import { getText } from "monogram/src/gen-parser.ts";
import { evaluate, type Scope } from "./expression.ts";
import { markdown, parse, type Element, type Part, type Syntax } from "./parse.ts";
import type {
  CompiledDocument,
  CompileOptions,
  InputName,
  SelectedInput,
  Part as DocumentPart,
} from "./types.ts";

export function attributes({
  source,
  tree,
  scope,
  context,
  only,
}: Syntax & { scope: Scope; context?: Scope; only?: readonly string[] }): Scope {
  return Object.fromEntries(
    tree.children.flatMap((child) => {
      if (!("rule" in child) || child.rule !== "Attribute") return [];
      const [name, , value] = child.children;
      if (only && !only.includes(getText(name, source))) return [];
      return [
        [getText(name, source), value ? evaluate({ node: value, source, scope, context }) : true],
      ];
    }),
  );
}

/** Resolves the template directly to Markdown while retaining its authored source. */
export function compile<
  Schema extends Module = Module<Record<string, unknown>>,
  const Name extends InputName<Schema> | undefined = undefined,
>(
  source: string,
  options?: CompileOptions<Schema, Name>,
): CompiledDocument<Schema, SelectedInput<Schema, Name>>;
export function compile(
  source: string,
  options: CompileOptions<Module<Record<string, any>>, string> = {},
): CompiledDocument {
  return compileDocument(parse(source), options);
}

export function compileDocument(
  document: ReturnType<typeof parse>,
  {
    schema,
    input: inputName,
    includes = {},
  }: {
    schema?: Module<Record<string, any>>;
    input?: string;
    includes?: CompileOptions["includes"];
  } = {},
): CompiledDocument {
  const schemaScope = type.scope<Record<string, any>>(schema ?? document.frontmatter.schema ?? {});
  const schemas = schema ?? schemaScope.export();
  const selectedInput = inputName ?? document.frontmatter.input;
  const input = selectedInput === undefined ? undefined : schemas[selectedInput];
  const context = { $schema: schemas, $frontmatter: document.frontmatter };
  const optionalValues = Object.fromEntries(
    input?.out
      .select({ kind: "optional", boundary: "shallow" })
      .map(({ key }) => [key, undefined]) ?? [],
  );

  function text(offset: number, end: number, indent: number): string {
    const source = document.content.slice(offset, end);
    if (!indent || !source) return source;
    const prefix =
      offset && document.content[offset - 1] !== "\n"
        ? source.slice(0, source.indexOf("\n") < 0 ? source.length : source.indexOf("\n") + 1)
        : "";
    const rest = source.slice(prefix.length);
    const terminated = rest.endsWith("\n");
    const state = new markdown.block.State(terminated ? rest : `${rest}\n`, markdown, {}, []);
    const lines = state.getLines(0, state.lineMax, indent, true);
    return prefix + (terminated ? lines : lines.slice(0, -1));
  }

  function resolve(
    parts: Part[],
    scope: Scope,
    offset: number,
    end: number,
    indent: number,
  ): string {
    const chunks = parts.map((part, index) => {
      const before = text(index ? parts[index - 1].end : offset, part.offset, indent);
      if (part.kind === "escape") return before + part.value;
      if (part.kind === "expression") {
        const value = evaluate({ node: part.tree, source: part.source, scope, context });
        return before + (value == null ? "" : String(value));
      }
      const padding = " ".repeat(Math.max(0, part.indent - indent));
      return before + renderElement(part, scope).replace(/^(?=.)/gm, padding);
    });
    return chunks.join("") + text(parts.at(-1)?.end ?? offset, end, indent);
  }

  function renderElement(part: Element, scope: Scope): string {
    const props = attributes({ ...part, scope, context });
    const body = (values: Scope) =>
      resolve(part.children, values, part.bodyOffset, part.bodyEnd, part.bodyIndent);
    switch (part.name) {
      case "show":
        return props.if ? body(scope) : "";
      case "each":
        return Object.values(props.items as Record<string, unknown> | unknown[])
          .map((item) => body({ ...scope, [String(props.as)]: item }))
          .join("");
      case "match": {
        const branches = part.children.filter((child) => child.kind === "element");
        const matcher = schemaScope.match.in<unknown>();
        branches
          .filter((child) => child.name === "case")
          .forEach((child) => {
            matcher.case(
              schemaScope.type.raw(attributes({ ...child, scope, context }).type) as Type<unknown>,
              () => child,
            );
          });
        const branch = matcher.default(() => branches.find((child) => child.name === "default"))(
          props.value,
        );
        return branch
          ? resolve(branch.children, scope, branch.bodyOffset, branch.bodyEnd, branch.bodyIndent)
          : "";
      }
      case "include": {
        const included = includes[String(props.src)];
        if (props.raw) return typeof included === "string" ? included : included.source!;
        const content =
          typeof included === "string"
            ? included
            : included.render({ ...scope, ...(props.with as Scope) });
        return part.inline ? content.replace(/\r?\n$/, "") : content;
      }
      default:
        throw new Error(`Unknown document construct: ${part.name}`);
    }
  }

  function publicPart(part: Part): DocumentPart {
    if (part.kind === "escape") return part;
    const { tree: _tree, ...node } = part;
    if (node.kind === "element") {
      return { ...node, children: node.children.map(publicPart) };
    }
    return node;
  }

  function renderValidated(values: unknown): string {
    return resolve(
      document.children,
      { ...optionalValues, ...(values as Scope) },
      0,
      document.content.length,
      0,
    );
  }

  return {
    source: document.source,
    content: document.content,
    contentOffset: document.source.length - document.content.length,
    frontmatter: document.frontmatter,
    children: document.children.map(publicPart),
    schemas,
    input,
    standard: input?.["~standard"],
    render(values: Scope = {}) {
      return renderValidated(
        selectedInput === undefined ? values : schemas[selectedInput].assert(values),
      );
    },
    renderValidated,
  };
}

