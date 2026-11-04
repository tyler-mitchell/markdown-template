import { program } from "cmd-mesh";
import { resolve } from "node:path";
import { createFile, readFile } from "package-management";
import { version } from "../../package.json";
import { loadProject } from "./config.ts";
import { load } from "./load.ts";
import { generateTypes } from "./typegen.ts";

const projectInput = {
  cwd: { type: "string", cli: "--cwd" },
  config: { type: "string", cli: "--config, -c" },
} as const;

/** CLI and programmatic commands share these handlers. */
export const commands = program({
  name: "markdown-template",
  version,
  commands: {
    list: {
      description: "List document paths relative to the configuration",
      input: projectInput,
      output: "string[]",
      run: async (input) => (await loadProject(input)).files,
      cli: { render: (files) => files.join("\n") },
    },
    typegen: {
      description: "Generate TypeScript declarations for discovered documents",
      input: projectInput,
      output: "string[]",
      run: async (input) => generateTypes(await loadProject(input)),
      cli: { render: (files) => files.join("\n") },
    },
    inspect: {
      description: "Read document metadata and native ArkType input/output schemas",
      input: { ...projectInput, file: { type: "string", cli: "<file>" } },
      output: {
        file: "string",
        frontmatter: "Record<string, unknown>",
        input: "unknown",
        output: "unknown",
      },
      run: async (input) => {
        const { cwd } = await loadProject(input);
        const document = await load({
          file: resolve(cwd, input.file),
        });
        return {
          file: document.file,
          frontmatter: document.frontmatter,
          input: document.input?.in.json,
          output: document.input?.out.json,
        };
      },
    },
    render: {
      description: "Render a document or the configured render jobs",
      input: {
        ...projectInput,
        file: { type: "string", cli: "[file]" },
        input: { type: "string", cli: "--input, -i" },
        output: { type: "string", cli: "--output, -o" },
      },
      output: [{ file: "string", output: "string | undefined", markdown: "string" }, "[]"],
      run: async (input) => {
        const { config, cwd } = await loadProject(input);
        const jobs = input.file
          ? [{ file: input.file, input: input.input, output: input.output }]
          : (config.render ?? []);
        const results = [];
        for (const job of jobs) {
          const document = await load({
            file: resolve(cwd, job.file),
          });
          const values =
            typeof job.input === "string"
              ? JSON.parse(readFile(resolve(cwd, job.input)))
              : job.input;
          const markdown = document.render(values);
          const output = job.output && resolve(cwd, job.output);
          if (output) {
            createFile(output, markdown);
          }
          results.push({ file: document.file, output, markdown });
        }
        return results;
      },
      cli: {
        render: (results) => results.map(({ output, markdown }) => output ?? markdown).join("\n"),
      },
    },
  },
});
