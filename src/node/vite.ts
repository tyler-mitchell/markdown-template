import { getPath } from "package-management";
import { attributes, compileDocument } from "../core/compile.ts";
import { parse } from "../core/parse.ts";

/** Imports .mdt files as compiled documents; Vite owns file loading and updates. */
export function markdownTemplate() {
  return {
    name: "vite-plugin-markdown-template",
    transform: {
      filter: {
        id: {
          include: /\.mdt(?:\?|$)/,
          exclude: /[?&](?:raw|url)(?:&|$)/,
        },
      },
      handler(source: string, id: string) {
        const [file] = id.split("?");
        const parsed = parse({ source, file });
        const document = compileDocument(parsed);
        const dependencies = new Map<string, boolean>();
        const pending = [...parsed.children];
        for (const part of pending) {
          if (part.kind !== "element") continue;
          pending.push(...part.children);
          if (part.name !== "include") continue;
          const { src, raw } = attributes({
            ...part,
            scope: {},
            context: { $schema: document.schemas, $frontmatter: document.frontmatter },
            only: ["src", "raw"],
          });
          const name = String(src);
          dependencies.set(name, (dependencies.get(name) ?? true) && Boolean(raw));
        }
        const includes = [...dependencies];
        const code = [
          'import { compile } from "markdown-template";',
          ...includes.map(
            ([src, raw], index) =>
              `import include${index} from ${JSON.stringify(getPath({ to: ["<current_folder>", src], from: file }) + (raw ? "?raw" : ""))};`,
          ),
          `export default compile(${JSON.stringify(source)}, { includes: {`,
          ...includes.map(([src], index) => `${JSON.stringify(src)}: include${index},`),
          "} });",
        ].join("\n");
        return { code, map: null };
      },
    },
  };
}
