import { getPath, readFile } from "package-management";
import { attributes, compileDocument } from "../core/compile.ts";
import { parse } from "../core/parse.ts";
import type { LoadedDocument } from "../core/types.ts";

/** Loads a document and resolves includes relative to their containing file. */
export async function load({ file }: { file: string }): Promise<LoadedDocument> {
  const path = getPath(["<cwd>", getPath({ to: file, startingFrom: "." })]);
  const source = readFile(path);
  const includes: Record<string, LoadedDocument | string> = {};
  const parsed = parse(source);
  const document = compileDocument(parsed, { includes });
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
    const file = getPath({ to: ["<current_folder>", name], from: path });
    if (raw) {
      includes[name] ??= readFile(file);
    } else {
      includes[name] = await load({ file });
    }
  }
  return { ...document, file: path, includes };
}
