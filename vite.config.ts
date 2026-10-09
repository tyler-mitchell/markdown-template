import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "CHANGELOG.md",
      "README.md",
      "test/fixtures/**/*.expected.md",
      "test/fixtures/**/*.actual.md",
      "examples/**/*.expected.md",
      "examples/**/*.actual.md",
    ],
  },
  pack: {
    define: { "process.env.PROF": "false" },
    entry: {
      index: "src/index.ts",
      "core/index": "src/core/index.ts",
      cli: "src/cli.ts",
    },
    dts: true,
    deps: {
      alwaysBundle: [/^monogram\//, /^arktype(?:\/|$)/, /^cmd-mesh$/],
      dts: {
        alwaysBundle: [/^arktype(?:\/|$)/, /^cmd-mesh$/],
        neverBundle: [/^monogram\//],
      },
    },
    publint: true,
    attw: true,
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    include: ["test/**/*.test.ts"],
    watchTriggerPatterns: [
      {
        pattern: /test\/fixtures\/.*(?:\.mdt|\.input\.json)$/,
        testsToRun: () => ["test/documents.test.ts"],
      },
    ],
  },
});
