import { type } from "arktype";
import { defineFileSystemStorage, getPath } from "package-management";
import { getText } from "monogram/src/gen-parser.ts";
import { evaluate, type Scope } from "./expression.ts";
import { markdown, parse, type Element, type Part, type Syntax } from "./parse.ts";

function attributes({ source, tree }: Syntax, scope: Scope, only?: string): Scope {
  return Object.fromEntries(
    tree.children.flatMap((child) => {
      if (!("rule" in child) || child.rule !== "Attribute") return [];
      const [name, , value] = child.children;
      if (only && getText(name, source) !== only) return [];
      return [[getText(name, source), value ? evaluate({ node: value, source, scope }) : true]];
    }),
  );
}

/** Resolves the template directly to Markdown while retaining its authored source. */
export function compile(
  source: string,
  includes: Record<string, { render(values: Scope): string }> = {},
) {
  const document = parse(source);
  const schemas = type.module<Record<string, any>>(document.frontmatter.schema ?? {});
  const input = document.frontmatter.input ? schemas[document.frontmatter.input] : undefined;

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
        const value = evaluate({ node: part.tree, source: part.source, scope });
        return before + (value == null ? "" : String(value));
      }
      const padding = " ".repeat(Math.max(0, part.indent - indent));
      return before + renderElement(part, scope).replace(/^(?=.)/gm, padding);
    });
    return chunks.join("") + text(parts.at(-1)?.end ?? offset, end, indent);
  }

  function renderElement(part: Element, scope: Scope): string {
    const props = attributes(part, scope);
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
        const branch =
          branches.find(
            (child) =>
              child.name === "case" &&
              schemas[String(attributes(child, scope).type)].allows(props.value),
          ) ?? branches.find((child) => child.name === "default");
        return branch
          ? resolve(branch.children, scope, branch.bodyOffset, branch.bodyEnd, branch.bodyIndent)
          : "";
      }
      case "include":
        return includes[String(props.src)].render({ ...scope, ...(props.with as Scope) });
      default:
        throw new Error(`Unknown document construct: ${part.name}`);
    }
  }

  return {
    ...document,
    schemas,
    input,
    render(values: Scope = {}) {
      const scope = input ? (input.assert(values) as Scope) : values;
      return resolve(document.children, scope, 0, document.content.length, 0);
    },
  };
}

/** Loads files through the project's canonical filesystem utilities. */
export async function load({
  file,
  fileSystemStorage,
}: {
  file: string;
  fileSystemStorage?: ReturnType<typeof defineFileSystemStorage>;
}) {
  const path = getPath(["<cwd>", getPath({ to: file, startingFrom: "." })]);
  const storage =
    fileSystemStorage ??
    defineFileSystemStorage({
      base: getPath({ to: "<current_folder>", from: path }),
    });
  const base = storage.getFilePath("");
  const source = await storage.readFile(getPath({ to: path, startingFrom: base }));
  if (source === undefined) throw new Error(`Document not found: ${path}`);
  const includes: Record<string, ReturnType<typeof compile>> = {};
  const document = compile(source, includes);
  const pending = [...document.children];
  for (const part of pending) {
    if (part.kind !== "element") continue;
    pending.push(...part.children);
    if (part.name === "include") {
      const { src } = attributes(part, {}, "src");
      includes[String(src)] = await load({
        file: getPath({ to: ["<current_folder>", String(src)], from: path }),
        fileSystemStorage: storage,
      });
    }
  }
  return document;
}
