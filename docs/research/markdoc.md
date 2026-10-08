# Markdoc reference

Retained findings from the earlier source inspection. The inspected revision was
not recorded. These are architectural references, not MDT implementation claims.

Upstream: <https://github.com/markdoc/markdoc>

Markdoc is a comparison reference. Its syntax and public AST API are not MDT
requirements or an accepted implementation template.

## Stated design goals

[Official overview](https://markdoc.dev/docs/overview), read 2026-10-08:
Markdoc favors familiar Markdown, declarative documents, static analysis, and
separation from arbitrary executable code. The overview does not explain the
specific choice of `{% %}` over angle brackets.

[Official FAQ](https://markdoc.dev/docs/faq#why-not-mdx), read 2026-10-08:
the documented distinction from MDX concerns declarative content versus embedded
JavaScript. That does not require a particular delimiter; HTML-like tags could
also express a declarative language.

The FAQ motivates this boundary through writing-focused authoring, predictable
presentation and flow control, and simpler validation, transforms, and static
analysis. Parsing a full programming language also requires tooling to account
for that language's constructs. A deliberately restricted grammar can therefore
serve a concrete purpose without introducing unfamiliar operators.

The FAQ also distinguishes Markdown compatibility from nesting ergonomics.
Setext headings are disabled by default but can be re-enabled. The optional
`allowIndentation` mode trades indented code blocks for arbitrarily indented tags.
These are explicit language choices, not evidence that parsing has failed.

## Markdown and custom syntax

```text
src/tokenizer/index.ts
  markdown-it
    → src/tokenizer/plugins/annotations.ts
      block, inline, and core rules
        → src/grammar/tag.pegjs
          custom tag contents
```

The Markdown plugin recognizes the delimiters and invokes the custom grammar.
The custom grammar does not replace Markdown parsing. This is the relevant
composition precedent for MDT and Monogram.

## Processing boundaries

```ts
const ast = Markdoc.parse(source);
const errors = Markdoc.validate(ast, config);
const content = Markdoc.transform(ast, config);
const html = Markdoc.renderers.html(content);
```

Parsing, contract validation, transformation, and rendering are separate phases.
MDT can preserve these responsibilities without requiring authors to construct
AST nodes.

## Frontmatter

Markdoc exposes frontmatter text through `ast.attributes.frontmatter`; a separate
parser reads that metadata. MDT requires the resulting `schema` value to pass
unchanged to `type.module`.

## Conditional sections

`src/tags/conditional.ts` interprets the generic `if` tag and its branches.
The tag grammar does not own branch evaluation. MDT's matching semantics likewise
belong outside its syntax parser.
