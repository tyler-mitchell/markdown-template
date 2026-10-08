# markdown-template

Markdown documents with frontmatter schemas and declarative expressions. The
document stays the authoring surface; applications supply values and decide what
to do with the resolved Markdown.

```sh
npm install markdown-template
```

```js
import { compile } from "markdown-template";

const document = compile("# Hello {name}");
console.log(document.render({ name: "World" })); // # Hello World
```

Use `load({ file })` to read a document from disk. Documents may declare ArkType
schemas in frontmatter and use `<$show>`, `<$each>`, `<$match>`, and `<$include>`
sections. See [examples](./examples) for complete documents.

MIT licensed.
