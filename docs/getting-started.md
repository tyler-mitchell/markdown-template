# Create your first document

This guide creates a deployment notice.
You write its wording once, then supply the service details for each release.

The project will contain these files:

```text
package.json
notice.mdt       # The reusable document
release.json     # The details for one release
notice.md        # The generated Markdown
```

## 1. Install the package

In a Node.js project, install Markdown Template:

```sh
pnpm add -D markdown-template
```

The CLI requires Node.js 24 or later.

## 2. Write the template

Create `notice.mdt`:

```mdt
---
schema:
  Change:
    title: string
    description: string
  Notice:
    service: string
    version: string
    changes: Change[]
input: Notice
---
# {{ service }} {{ version }}

This release includes:

<$each items={changes} as="change">
  - **{{ change.title }}**: {{ change.description }}
</$each>
```

The section between `---` lines is YAML frontmatter.
`schema` defines the data that the template accepts, using ArkType's syntax.
`Notice` is a name that you choose. `input: Notice` selects it as the argument schema.

In this document, `service` and `version` must be strings.
`Change` describes one change: an object with a title and a description.
`changes: Change[]` accepts an array of those objects.
The `<$each>` section names each object `change` and reads its two fields.

## 3. Supply the release details

Create `release.json`:

```json
{
  "service": "Asset API",
  "version": "2.0.0",
  "changes": [
    {
      "title": "Resumable uploads",
      "description": "Continue an interrupted upload without starting over."
    },
    {
      "title": "Clearer error reports",
      "description": "Use the request ID to find the failed upload."
    }
  ]
}
```

The template supplies the wording and layout.
This file supplies the values for one use of that template.

## 4. Generate the Markdown

Add a script to your `package.json`:

```json
{
  "scripts": {
    "docs:build": "markdown-template render notice.mdt --input release.json --output notice.md"
  }
}
```

Run the script:

```sh
pnpm docs:build
```

Open `notice.md`:

```md
# Asset API 2.0.0

This release includes:

- **Resumable uploads**: Continue an interrupted upload without starting over.
- **Clearer error reports**: Use the request ID to find the failed upload.
```

Change the values in `release.json` and run the script again.
The command reads the current files and replaces `notice.md`.
Invalid data produces a field error instead of a document.

## 5. Save several document jobs

For several documents, keep their paths in `markdown-template.config.json`:

```json
{
  "include": ["*.mdt"],
  "render": [
    {
      "file": "notice.mdt",
      "input": "release.json",
      "output": "output/notice.md"
    }
  ]
}
```

Then shorten the script:

```json
{
  "scripts": {
    "docs:build": "markdown-template render"
  }
}
```

The same `pnpm docs:build` command runs every job in `render`.
Each path is relative to the configuration file.
`include` selects the templates for discovery and type generation.

You can add a template or a render job without writing a separate program.

## Use the template in an application

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

The library and CLI use the same template and validation rules.
Continue with [application usage](programmatic.md) for browser compilation, native schemas, and source ranges.
