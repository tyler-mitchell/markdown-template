import { assert, expect, test } from "vite-plus/test";
import { type } from "arktype";
import { compile } from "../src/index.ts";

test("composes a symbol row inside a repeated section without changing its punctuation", () => {
  const document = compile(`---
schema:
  Symbol:
    name: string
    deprecated: boolean
    replacement?: string
    file: string
  Report:
    symbols: Symbol[]
input: Report
---
## Symbols

<$each items={symbols} as="symbol">
  - {{ symbol.name }}<$show if={symbol.deprecated}> (deprecated<$show if={symbol.replacement}>; use {{ symbol.replacement }}</$show>)</$show> — \`{{ symbol.file }}\`
</$each>
`);

  expect(
    document.render({
      symbols: [
        { name: "render", deprecated: true, replacement: "renderDocument", file: "src/render.ts" },
        { name: "parse", deprecated: false, file: "src/parse.ts" },
      ],
    }),
  ).toBe(`## Symbols

- render (deprecated; use renderDocument) — \`src/render.ts\`
- parse — \`src/parse.ts\`
`);
  const section = document.children.find((part) => part.kind === "element");
  assert(section);
  const condition = section.children.find((part) => part.kind === "element");
  assert(condition);
  expect(section.inline).toBe(false);
  expect(condition.inline).toBe(true);
  expect(document.content.slice(condition.offset, condition.end)).toBe(
    "<$show if={symbol.deprecated}> (deprecated<$show if={symbol.replacement}>; use {{ symbol.replacement }}</$show>)</$show>",
  );
  expect(condition).not.toHaveProperty("tree");
});

test("keeps a template instruction literal inside an authored fenced example", () => {
  const document = compile(`Use the delivery notice below:

\`\`\`mdt
<$show if={includeSupport}>Contact support.</$show>
\`\`\`

Deliver to {{ address }}.
`);

  expect(document.render({ address: "help@example.com" })).toBe(`Use the delivery notice below:

\`\`\`mdt
<$show if={includeSupport}>Contact support.</$show>
\`\`\`

Deliver to help@example.com.
`);
});

test("reads each document's own frontmatter while sharing render arguments", () => {
  const footer = compile(`---
team: Platform support
---
Contact {{ $frontmatter.team }}.`);
  const document = compile(
    `---
title: Deployment notice
---
# {{ $frontmatter.title }}

{{ service }} is ready. <$include src="footer" />
`,
    { includes: { footer } },
  );

  expect(
    document.render({
      service: "Asset processing",
      $frontmatter: { title: "Caller value", team: "Caller team" },
    }),
  ).toBe(`# Deployment notice

Asset processing is ready. Contact Platform support.
`);
  expect(document.frontmatter).toEqual({ title: "Deployment notice" });
});

test("uses an application-owned formatter with the compiled symbol type", () => {
  const document = compile(
    `Symbol results ({{ count }}):

<$each items={symbols} as="symbol">
  - {{ formatSymbol(symbol) }}
</$each>
`,
    {
      schema: type.module({
        Symbol: { name: "string", file: "string", line: "number", character: "number" },
        Report: { count: "number", symbols: "Symbol[]", formatSymbol: "Function" },
      }),
      input: "Report",
    },
  );
  expect(
    document.render({
      count: 1,
      symbols: [{ name: "renderDocument", file: "src/document.ts", line: 12, character: 4 }],
      formatSymbol: (symbol: typeof document.schemas.Symbol.infer) =>
        `${symbol.name} — ${symbol.file}:${symbol.line}:${symbol.character}`,
    }),
  ).toBe(`Symbol results (1):

- renderDocument — src/document.ts:12:4
`);
});
