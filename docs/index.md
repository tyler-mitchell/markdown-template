# Markdown Template

Markdown Template turns a reusable Markdown document and some data into finished Markdown.
Use it for documents that share a structure: release notes, reports, instructions, or prompts.

For example, keep the wording of a deployment notice in `notice.mdt`:

```mdt
---
schema:
  Notice:
    service: string
    version: string
input: Notice
---
# {{ service }} release

Version {{ version }} is ready for review.
```

Supply the details for this release:

```json
{ "service": "Asset API", "version": "2.0.0" }
```

The result is an ordinary Markdown document:

```md
# Asset API release

Version 2.0.0 is ready for review.
```

The section between `---` lines defines the document's data.
Here, `Notice` requires two strings. `input: Notice` selects that definition.
Each `{{ expression }}` inserts a value into the Markdown.

A template can also repeat content, show conditional sections, and include other files.
Its schema can define defaults and descriptions.

## Start here

- [Create your first document](getting-started.md): install the package, write the files, and generate Markdown.
- [Use it in an application](programmatic.md): render documents from JavaScript or TypeScript and inspect their schemas.
- [Use it in a Vite application](browser.md): import `.mdt` files and generate their TypeScript declarations.

The library can compile and render source text entirely in a browser.
The CLI adds file loading, configuration, and type generation for Node.js projects.
