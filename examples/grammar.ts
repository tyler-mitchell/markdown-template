import { program } from "cmd-mesh";
import { defineFileSystemStorage } from "package-management";
import { parse } from "../src/parse.ts";
import { load } from "../src/document.ts";

const fileSystemStorage = defineFileSystemStorage({ base: process.cwd() });
const demo = program({
  name: "mdt-grammar",
  version: "0.0.0",
  cli: { default: "parse" },
  commands: {
    inspect: {
      description: "Inspect the authored input schema and the supplied values after defaults.",
      input: {
        file: { type: "string", cli: "<file>" },
        input: { type: "string", cli: "<input>" },
      },
      run: async ({ file, input }) => {
        const values = await fileSystemStorage.readFile(input);
        if (values === undefined) throw new Error(`Input not found: ${input}`);
        const document = await load({ file, fileSystemStorage });
        const supplied = JSON.parse(values);
        return {
          schema: document.input?.json,
          input: document.input ? document.input.assert(supplied) : supplied,
        };
      },
    },
    render: {
      description: "Render an MDT document using a JSON input file.",
      input: {
        file: { type: "string", cli: "<file>" },
        input: { type: "string", cli: "<input>" },
      },
      run: async ({ file, input }) => {
        const values = await fileSystemStorage.readFile(input);
        if (values === undefined) throw new Error(`Input not found: ${input}`);
        const document = await load({ file, fileSystemStorage });
        return document.render(JSON.parse(values));
      },
    },
    parse: {
      description: "Parse an MDT file and inspect its embedded expressions.",
      input: {
        file: { type: "string", cli: "<file>" },
      },
      run: async ({ file }) => {
        const source = await fileSystemStorage.readFile(file);
        if (source === undefined) return { file, error: "File not found." };
        const document = parse(source);
        return {
          file,
          frontmatter: document.frontmatter,
          tokens: document.tokens.map(({ type, tag, map }) => ({ type, tag, map })),
        };
      },
    },
  },
});

await demo.main();
