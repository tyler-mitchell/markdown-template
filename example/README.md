# Markdown Template examples

Run `pnpm demo` from the repository root.

The app has two separate routes:

- **Editor:** renders an MDT document in the browser, then edits its Markdown
  output directly in one Lexical surface.
- **Server rendering:** a TanStack Start server function loads an MDT file from
  disk, validates submitted data, and returns Markdown.

The editor offers a short notice, a release handoff, and deployment instructions.
These exercise repeated sections, type matching, shared templates, and raw file
includes. Switching documents keeps each draft and its undo history.
Edits affect the rendered draft, not its template or input data.

`templates/` and `data/` hold the actual documents and sample inputs. The app uses
the public `markdown-template` package entry.

The headless plugin lives in `packages/lexical`. This app supplies the React
composition, shadcn controls, layout, and styles. Agent Hub can supply its own UI.

## CLI

From this directory:

```sh
pnpm docs:build
pnpm typegen
```

`markdown-template.config.ts` defines document discovery and render outputs.
Generated declaration files describe the templates' native ArkType input types.
