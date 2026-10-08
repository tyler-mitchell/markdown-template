import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "CHANGELOG.md",
      "test/fixtures/**/*.expected.md",
      "test/fixtures/**/*.actual.md",
    ],
  },
  pack: {
    entry: ["src/index.ts"],
    dts: true,
    deps: {
      alwaysBundle: [/^monogram\//, /^arktype(?:\/|$)/],
      dts: { neverBundle: [/^monogram\//, /^arktype(?:\/|$)/] },
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
