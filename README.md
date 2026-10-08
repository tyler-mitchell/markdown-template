# markdown-template

Markdown documents with frontmatter schemas and declarative expressions. The
document stays the authoring surface; applications supply values and decide what
to do with the resolved Markdown.

```sh
npm install markdown-template
```

```js
import { compile } from "markdown-template";

const document = compile("# Hello {{name}}");
console.log(document.render({ name: "World" })); // # Hello World
```

Use `load({ file })` to read a document from disk. Documents may declare ArkType
schemas in frontmatter and use `<$show>`, `<$each>`, `<$match>`, and `<$include>`
sections. See [examples](./examples) for complete documents.

## Compiled documents

`compile(source, options?)` and `load({ file })` return the same document contract.
`load` resolves included files relative to their containing document.

| Member                    | Meaning                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `source`                  | Complete authored source, including frontmatter.                     |
| `content`                 | Markdown body without frontmatter.                                   |
| `contentOffset`           | Body's UTF-16 offset within `source`.                                |
| `frontmatter`             | Parsed metadata, including the authored schema definition.           |
| `children`                | Template expressions, escapes, and elements with source ranges.      |
| `schemas`                 | Native ArkType module. A supplied module retains its identity.       |
| `input`                   | Selected native argument type, or `undefined` when none is declared. |
| `standard`                | That type's native `~standard` interface, or `undefined`.            |
| `render(values)`          | Validate raw arguments, apply defaults/transforms, produce Markdown. |
| `renderValidated(values)` | Render schema output without validating or transforming it again.    |
| `file`                    | Resolved file path on documents returned by `load`.                  |

Code-defined modules retain ArkType inference. Schemas read from a string or file
are known at runtime: validation output is `unknown` at compile time. Reading a
file does not generate TypeScript types.

`render()` permits omitted arguments when the selected static schema accepts `{}`.
Required arguments remain required. Documents without an argument schema accept
a record of values. Neither rendering method updates the source or saves values.

### Validate external input

```ts
import { type } from "arktype";
import { compile } from "markdown-template";

const document = compile("Retry delay: {{ delayMs }} ms.", {
  schema: type.module({
    RetryPolicy: { delayMs: "string.numeric.parse" },
  }),
  input: "RetryPolicy",
});

const raw: unknown = { delayMs: "2500" };
const result = await document.standard.validate(raw);

if (result.issues) {
  console.error(result.issues);
} else {
  // result.value is { delayMs: number }.
  console.log(document.renderValidated(result.value));
}

document.render({ delayMs: "2500" }); // Also produces: Retry delay: 2500 ms.
```

Use `renderValidated` after native validation succeeds. It trusts its arguments.
Passing transformed output back to `render` can fail or apply a transform twice.
Included documents validate the values passed to their own `render` method.

`input` remains a Standard Schema-compatible object for libraries that accept
that protocol. `standard` exposes its native validation and JSON Schema methods
directly; MDT does not define another schema format.

## Schema metadata

Programmatic callers pass a native ArkType module:

```ts
import { type } from "arktype";
import { compile } from "markdown-template";

const document = compile("Timeout: {{timeoutMs}} ms.", {
  schema: type.module({
    Integration: {
      timeoutMs: type("number")
        .configure({ description: "Maximum request duration in milliseconds." })
        .default(5000),
    },
  }),
  input: "Integration",
});
document.render({}); // Timeout: 5000 ms.
```

`compile` also accepts `includes`, a map of names to compiled documents.
Programmatic `schema` and `input` options take precedence over frontmatter.
`input` is restricted to the supplied module's type exports.

`$schema` is the supplied module or the module compiled from frontmatter `schema`.
`input` selects argument validation; all module exports remain accessible:

```md
{{$schema.Integration.out.get("timeoutMs").meta.description}}
Configured: {{timeoutMs}} ms.
```

`.out` describes validated values after defaults. `.get("contact", "channel")`
looks up a nested field; `.props` lists field descriptors.
Referenced types retain their resolved metadata.

File-authored schemas support defaults in `@` metadata tuples through MDT's
bundled ArkType patch. Supplied native modules retain their original semantics;
use ArkType's `.default(...)` for portable code-defined defaults.

`$frontmatter` exposes the current document's metadata:

```mdt
# {{ $frontmatter.title }}
```

The `$schema` and `$frontmatter` bindings are reserved: input properties and loop
aliases cannot replace them. Each included document receives its own bindings.
Expressions use native JavaScript evaluation; authored templates must be trusted.
Text interpolation uses `{{ expression }}`; construct attributes retain
`{expression}`, as in `<$show if={enabled}>`.

## Inline composition

```mdt
Found {{ count }} symbols<$show if={anchor}> in `{{ anchor }}`</$show>.

Contact: <$include src="./support.mdt" with={{contact: supportContact}} />.
```

The space before `in` belongs to the conditional. When `anchor` is absent from
the declared optional inputs, the result is `Found 3 symbols.`. With an anchor
of `packages/core`, it is ``Found 3 symbols in `packages/core`.``.

Inline includes remove one final line ending from the included document.
Block includes preserve it. Inline constructs must close within the same
Markdown block. Construct tags inside code blocks remain literal content.

## Source editing

Ranges are half-open UTF-16 offsets within `content`, matching JavaScript string
slicing. Add `contentOffset` to address the complete source. Elements expose
`bodyOffset`, `bodyEnd`, and nested `children`; interpolation ranges include
their `{{` and `}}` delimiters.

```ts
import { compile } from "markdown-template";

const document = compile("Hello **{{ recipient }}**.");
const selected = document.children.find((part) => part.kind === "expression");

if (selected) {
  const editedSource =
    document.source.slice(0, document.contentOffset + selected.offset) +
    "{{ reviewer }}" +
    document.source.slice(document.contentOffset + selected.end);
  const edited = compile(editedSource);
  edited.render({ reviewer: "Maya" }); // Hello **Maya**.
}
```

Recompile after source changes; ranges belong to that source snapshot. Supply
the same compile options again for code-defined schemas and includes.
Native `input` metadata provides descriptions, defaults, and allowed values for
contextual controls without duplicating the schema.

The public source structure contains template constructs, not a Markdown AST.
It supports source edits and repeated previews. It does not map rendered output
back to source occurrences, recover incomplete syntax, or implement an editor.
Custom component registration and directory discovery are not exposed by this API.

## Matching

Case types accept ArkType expressions and names from the document's schema.
The first matching case renders. An optional `<$default>` handles unmatched values.

```mdt
---
schema:
  Unavailable: "'unavailable'"
  Report:
    latencyMs: number | Unavailable
input: Report
---
<$match value={latencyMs}>
  <$case type="number > 100">Slow response: {{ latencyMs }} ms.</$case>
  <$case type="number">Response within budget: {{ latencyMs }} ms.</$case>
  <$case type="Unavailable">The service did not respond.</$case>
</$match>
```

MIT licensed.
