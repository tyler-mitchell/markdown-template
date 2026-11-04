import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "CHANGELOG.md",
      "README.md",
      "example/src/routeTree.gen.ts",
      "test/fixtures/**/*.expected.md",
      "test/fixtures/**/*.actual.md",
      "example/**/*.expected.md",
      "example/**/*.actual.md",
      "**/*.d.mdt.ts",
    ],
  },
  pack: {
    define: { "process.env.PROF": "false" },
    treeshake: { moduleSideEffects: [{ test: /^monogram\//, sideEffects: false }] },
    entry: {
      index: "src/index.ts",
      "core/index": "src/core/index.ts",
      cli: "src/cli.ts",
    },
    dts: true,
    copy: [
      { from: "node_modules/arktype/out", to: "dist/vendor", rename: "arktype" },
      { from: "node_modules/arktype/LICENSE", to: "dist/vendor", rename: "arktype.LICENSE" },
    ],
    deps: {
      alwaysBundle: [/^monogram\//, /^cmd-mesh$/],
      neverBundle: ["#arktype"],
      dts: {
        alwaysBundle: [/^cmd-mesh$/],
        neverBundle: ["#arktype", /^monogram\//],
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
