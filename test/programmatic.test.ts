import { expect, expectTypeOf, test } from "vite-plus/test";
import { type, TraversalError } from "arktype";
import { compile, type CompileOptions } from "../src/index.ts";

test("uses a native module for defaults, metadata, and input validation", () => {
  const document = compile(
    `{{$schema.Request.out.get("timeoutMs").meta.description}}
Timeout: {{timeoutMs}} ms.
`,
    {
      schema: type.module({
        Request: {
          timeoutMs: type("number")
            .configure({ description: "Maximum request duration in milliseconds." })
            .default(5000),
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
  expect(document.render()).toBe(`Maximum request duration in milliseconds.
Timeout: 5000 ms.
`);
  expect(() => {
    // @ts-expect-error Raw arguments must match the selected schema.
    document.render({ timeoutMs: "slow" });
  }).toThrow(TraversalError);

  expectTypeOf(document.input).toEqualTypeOf<typeof document.schemas.Request>();
  expectTypeOf(document.render).parameter(0).toEqualTypeOf<{ timeoutMs?: number } | undefined>();
  expectTypeOf(document.renderValidated).parameter(0).toEqualTypeOf<{ timeoutMs: number }>();
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

test("preserves a shared module and infers required arguments through reusable options", () => {
  const schema = type.module({
    Person: { name: "string" },
    Review: { reviewer: "Person", status: "'requested' | 'approved'" },
  });
  const options = { schema, input: "Review" } satisfies CompileOptions<typeof schema>;
  const document = compile("Review {{ status }} by {{ reviewer.name }}.", options);

  expect(document.schemas).toBe(schema);
  expect(document.input).toBe(schema.Review);
  expectTypeOf<CompileOptions<typeof schema>>()
    .toHaveProperty("input")
    .toEqualTypeOf<"Person" | "Review" | undefined>();
  expectTypeOf(document.render).parameters.toEqualTypeOf<
    [values: { reviewer: { name: string }; status: "requested" | "approved" }]
  >();
  expect(document.render({ reviewer: { name: "Maya" }, status: "approved" })).toBe(
    "Review approved by Maya.",
  );
  const render = document.render;
  expect(render({ reviewer: { name: "Luis" }, status: "requested" })).toBe(
    "Review requested by Luis.",
  );
  expect(() => {
    // @ts-expect-error A required review cannot be omitted.
    document.render();
  }).toThrow(TraversalError);
});

test("uses application schema options without rewriting the authored document contract", () => {
  const source = `---
title: Delivery notice
schema:
  Email:
    destination: string.email
input: Email
---
{{ $frontmatter.title }}: {{ destination }}.
`;
  const schema = type.module({ Channel: { destination: "'#releases' | '#engineering'" } });
  const document = compile(source, { schema, input: "Channel" });

  expect(document.schemas).toBe(schema);
  expect(document.input).toBe(schema.Channel);
  expect(document.frontmatter.input).toBe("Email");
  expect(document.frontmatter.schema).toEqual({ Email: { destination: "string.email" } });
  expect(document.render({ destination: "#releases" })).toBe("Delivery notice: #releases.\n");
  expect(document.source).toBe(source);
  expectTypeOf(document.render).parameter(0).toEqualTypeOf<{
    destination: "#releases" | "#engineering";
  }>();
});

test("renders a metadata-only document without requiring an argument schema", () => {
  const document = compile(`---
title: Maintenance notice
---
# {{ $frontmatter.title }}

The scheduled maintenance is complete.
`);

  expect(document.input).toBeUndefined();
  expect(document.standard).toBeUndefined();
  expect(document.file).toBeUndefined();
  expect(document.render()).toBe(`# Maintenance notice

The scheduled maintenance is complete.
`);
});

test("binds optional fields from a transformed notification contract", () => {
  const document = compile(
    "{{ service }}<$show if={reference}> — incident {{ reference }}</$show>.",
    {
      schema: type.module({
        Notice: type({ service: "string", "incident?": "string" })
          .pipe(({ service, incident }) =>
            incident ? { service, reference: incident } : { service },
          )
          .to({ service: "string", "reference?": "string" }),
      }),
      input: "Notice",
    },
  );

  expect(document.render({ service: "Search" })).toBe("Search.");
  expect(document.render({ service: "Search", incident: "INC-42" })).toBe(
    "Search — incident INC-42.",
  );
  expect(document.renderValidated({ service: "Search" })).toBe("Search.");
  expectTypeOf(document.renderValidated).parameter(0).toEqualTypeOf<{
    service: string;
    reference?: string;
  }>();
});
