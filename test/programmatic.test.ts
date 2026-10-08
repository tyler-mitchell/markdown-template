import { expect, expectTypeOf, test } from "vite-plus/test";
import { type, TraversalError, type Module } from "arktype";
import { compile } from "../src/index.ts";

test("uses a native module for defaults, metadata, and input validation", () => {
  const document = compile(
    `{{$schema.Request.out.get("timeoutMs").meta.description}}
Timeout: {{timeoutMs}} ms.
`,
    {
      schema: type.module({
        Request: {
          timeoutMs: [
            "number",
            "@",
            { default: 5000, description: "Maximum request duration in milliseconds." },
          ],
        },
      }),
      input: "Request",
    },
  );

  expect(document.render({})).toBe(`Maximum request duration in milliseconds.
Timeout: 5000 ms.
`);
  expect(document.render({ timeoutMs: 2000 })).toBe(`Maximum request duration in milliseconds.
Timeout: 2000 ms.
`);
  expect(document.input).toBe(document.schemas.Request);
  expect(() => document.render({ timeoutMs: "slow" })).toThrow(TraversalError);

  expectTypeOf(compile<Module<{ Request: { timeoutMs: number } }>>)
    .parameter(1)
    .exclude<undefined>()
    .toHaveProperty("input")
    .toEqualTypeOf<"Request" | undefined>();
});

test("includes a separately compiled document with its own input schema", () => {
  const support = compile(
    `Contact {{contact}} for support.
`,
    {
      schema: type.module({ Support: { contact: "string.email" } }),
      input: "Support",
    },
  );

  const handoff = compile(
    `# {{project}}

<$include src="support" with={{contact: supportContact}} />
`,
    {
      schema: type.module({ Handoff: { project: "string", supportContact: "string" } }),
      input: "Handoff",
      includes: { support },
    },
  );

  const actual = handoff.render({
    project: "Orchard help center",
    supportContact: "support@example.com",
  });

  expect(actual).toBe(`# Orchard help center

Contact support@example.com for support.
`);
  expect(() =>
    handoff.render({ project: "Orchard help center", supportContact: "not-an-email" }),
  ).toThrow(TraversalError);
});
