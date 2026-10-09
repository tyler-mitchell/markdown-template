# Compile documents in application code

Use the library when your application already has the data for a document.
It returns Markdown as a string. Your application decides where to show or save that string.

## Define a document in TypeScript

Pass the Markdown body and a native ArkType module to `compile`.
The `input` argument selects the type that describes the render arguments.

```ts
import { compile, type } from "markdown-template";

const document = compile(
  `# {{ service }}

Request timeout: {{ timeoutMs }} ms.
`,
  {
    schema: type.module({
      Notice: {
        service: "string",
        timeoutMs: [
          "number > 0",
          "@",
          {
            default: 5000,
            description: "Maximum request duration in milliseconds.",
          },
        ],
      },
    }),
    input: "Notice",
  },
);

const markdown = document.render({ service: "Asset API" });
```

`markdown` contains:

```md
# Asset API

Request timeout: 5000 ms.
```

`compile` runs in browsers and Node.
It returns Markdown, metadata, source ranges, and the native ArkType schemas.
It performs no file access.

## Use the inferred argument types

```ts
type Arguments = typeof document.input.inferIn;
// { service: string; timeoutMs?: number }

type Validated = typeof document.input.infer;
// { service: string; timeoutMs: number }

document.render({ service: "Asset API", timeoutMs: 2000 });
```

`Arguments` permits an omitted timeout. `Validated` requires the resolved timeout.
The compiler retains the supplied module and selected Type object.
It does not construct a replacement schema.

## Validate before preview

An interactive application can show field errors before it renders a preview.
Use the document's validator to get either validated values or a list of issues:

```ts
const result = document.standard.validate({ service: "Asset API", timeoutMs: 2000 });

if (result.issues) {
  console.log(result.issues);
} else {
  console.log(document.renderValidated(result.value));
}
```

`standard` exposes the native Standard Schema interface at the document level.
`render` validates raw arguments. `renderValidated` accepts the result of validation.
Use `renderValidated` to prevent a transform from running twice.

## Read metadata

```ts
const timeout = document.input.out.get("timeoutMs");

console.log(timeout.meta.description);

const inputSchema = document.standard.jsonSchema.input({
  target: "draft-2020-12",
});

const outputSchema = document.standard.jsonSchema.output({
  target: "draft-2020-12",
});
```

ArkType owns field descriptions, defaults, constraints, and JSON Schema conversion.
Conversion retains native diagnostics for types that JSON Schema cannot represent.

## Locate authored expressions

```ts
for (const part of document.children) {
  const start = document.contentOffset + part.offset;
  const end = document.contentOffset + part.end;
  console.log(document.source.slice(start, end));
}
```

Offsets count UTF-16 units in the Markdown body.
`contentOffset` locates that body after frontmatter.
Elements also expose their children and body ranges.

These ranges identify authored constructs. They do not map every rendered character back to its source.
The compiler does not provide recovery for incomplete syntax or a complete editor implementation.

## Locate invalid syntax

Keep the draft editable when compilation fails. `TemplateSyntaxError` identifies
the affected construct in the complete source, including frontmatter.

```ts
import { compile, TemplateSyntaxError } from "markdown-template";

const draft = "# Release\n\nVersion: {{ version. }}";

try {
  compile(draft);
} catch (error) {
  if (error instanceof TemplateSyntaxError) {
    console.log(error.line, error.column); // 3, 10
    console.log(draft.slice(error.offset, error.end)); // {{ version. }}
  }
}
```

Offsets count UTF-16 units; lines and columns start at 1. `load` and Vite imports
also supply `error.file`. The underlying parser error remains in `error.cause`.
Schema and argument failures retain ArkType's own diagnostics.

## Use an authored file

For a document authored as a `.mdt` file, keep its schema in that file:

```ts
import { load } from "markdown-template";

const notice = await load({ file: "./notice.mdt" });
const markdown = notice.render({
  service: "Asset API",
  version: "2.0.0",
  changes: [
    {
      title: "Resumable uploads",
      description: "Continue an interrupted upload without starting over.",
    },
  ],
});
```

This loads the file from the [getting-started guide](getting-started.md).
`load` runs in Node and resolves includes relative to each document.

TypeScript cannot infer fields from a filesystem read.
Use the native module approach for definitions authored in code.
Generated declarations supply static types for `.mdt` imports.
