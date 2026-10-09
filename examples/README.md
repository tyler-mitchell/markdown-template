# Release documents

This Vite app consumes `markdown-template` through its public package entry.
It previews the same release notice used in the getting-started guide.

From the repository root:

```sh
pnpm build
pnpm --dir examples dev
```

Edit the release details in the app to update the preview.
Invalid data displays a validation error and keeps the last valid document visible.

The package scripts also generate Markdown files and build the browser app:

```sh
pnpm --dir examples docs:build
pnpm --dir examples build
```

## Files

```text
templates/notice.mdt                  Document with an array of change objects
templates/release-handoff.mdt         Document with conditions, defaults, and a shared section
data/release.json                     Notice arguments
data/release-handoff.json             Handoff arguments
markdown-template.config.ts          Discovery and render jobs
vite.config.ts                       MDT imports
src/main.ts                          Validation and browser preview
output/*.actual.md                   Generated Markdown
output/*.expected.md                 Authored expected Markdown
```

`typegen` writes `.d.mdt.ts` declarations beside the templates.
The application imports those templates directly; it does not import repository source files.
