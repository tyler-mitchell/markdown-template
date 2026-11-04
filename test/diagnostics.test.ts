import { expect, test } from "vite-plus/test";
import { compile, markdownTemplate, TemplateSyntaxError } from "../src/index.ts";

test.each([
  {
    body: "Release 🚀 {{ version. }}.",
    fragment: "{{ version. }}",
    line: 10,
    column: 12,
  },
  {
    body: "<$show if={version.}>\nReady for review.\n</$show>",
    fragment: "<$show if={version.}>",
    line: 10,
    column: 1,
  },
  {
    body: "<$show if={version}>\nReady for review.\n</$each>",
    fragment: "</$each>",
    line: 12,
    column: 1,
  },
  {
    body: "<$show if={version}>\nReady for review.",
    fragment: "<$show if={version}>",
    line: 10,
    column: 1,
  },
])("locates $fragment in the authored document", ({ body, fragment, line, column }) => {
  const source = `---
title: Release notice
schema:
  Release:
    version: string
input: Release
---
# Release

${body}`;
  expect(() => compile(source)).toThrow(TemplateSyntaxError);
  expect(() => compile(source)).toThrow(
    expect.objectContaining({
      offset: source.indexOf(fragment),
      end: source.indexOf(fragment) + fragment.length,
      line,
      column,
    }),
  );
});

test("retains parser diagnostics and the imported file name", () => {
  const source = "# Release\n\nVersion: {{ version. }}";
  const plugin = markdownTemplate();
  expect(() => plugin.transform.handler(source, "/workspace/release.mdt")).toThrow(
    expect.objectContaining({
      file: "/workspace/release.mdt",
      line: 3,
      column: 10,
      cause: expect.any(Error),
    }),
  );
});
