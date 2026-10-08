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

## Schema metadata

Programmatic callers pass a native ArkType module:

```ts
import { type } from "arktype";
import { compile } from "markdown-template";

const document = compile("Timeout: {{timeoutMs}} ms.", {
  schema: type.module({
    Integration: {
      timeoutMs: [
        "number",
        "@",
        {
          default: 5000,
          description: "Maximum request duration in milliseconds.",
        },
      ],
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
Default: {{$schema.Integration.out.get("timeoutMs").meta.default}} ms.
Configured: {{timeoutMs}} ms.
```

`.out` describes validated values after defaults. `.get("contact", "channel")`
looks up a nested field; `.props` lists field descriptors.
Referenced types retain their resolved metadata.

The `$schema` binding is reserved: input properties and loop aliases cannot
replace it. Each included document receives its own schema module.
Expressions use native JavaScript evaluation; authored templates must be trusted.
Text interpolation uses `{{ expression }}`; construct attributes retain
`{expression}`, as in `<$show if={enabled}>`.

MIT licensed.
