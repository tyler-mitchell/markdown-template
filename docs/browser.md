# Use documents in a Vite application

The compiler can render a document entirely in the browser.
The Vite plugin loads `.mdt` imports and their included files during development and builds.

This guide assumes an existing Vite application.
The [example app](../example/) contains a complete consumer with its own `package.json`.

## Add the plugin

Install `markdown-template` as an application dependency:

```sh
pnpm add markdown-template
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { markdownTemplate } from "markdown-template";

export default defineConfig({
  plugins: [markdownTemplate()],
});
```

Vite+ applications can import `defineConfig` from `vite-plus`.

## Import a document

Use the `notice.mdt` and `release.json` files from the [first guide](getting-started.md):

```ts
import notice from "./notice.mdt";
import release from "./release.json";

const markdown = notice.render(release);
```

The imported value is a compiled document.
It has the same `render`, `standard`, `schemas`, and source properties as `compile`.
Rendering needs no server request.

## Give TypeScript the document's argument types

Add `markdown-template.config.json`:

```json
{
  "include": ["**/*.mdt"]
}
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "templates:types": "markdown-template typegen"
  }
}
```

Run it before your TypeScript check:

```sh
pnpm templates:types
```

The command writes a declaration beside each document:

```text
notice.mdt
notice.d.mdt.ts
```

Enable arbitrary file extensions in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",
    "allowArbitraryExtensions": true,
    "customConditions": ["browser"]
  }
}
```

TypeScript uses `notice.d.mdt.ts` to understand `import notice from "./notice.mdt"`.
This filename follows TypeScript's declaration convention for custom extensions.
Vite supplies the runtime import; the declaration supplies its types.

```ts
import notice from "./notice.mdt";

notice.render({
  service: "Asset API",
  version: "2.0.0",
  changes: [
    {
      title: "Resumable uploads",
      description: "Continue an interrupted upload without starting over.",
    },
  ],
});

type NoticeArguments = typeof notice.input.inferIn;
```

The generated contract makes `changes` an array of objects with `title` and `description`.
It preserves optional defaults and distinguishes transform inputs from their results.
The declaration retains the authored schema, including descriptions and defaults.
ArkType infers its types directly.

Run type generation again after schema changes.
The command replaces its current declarations and removes unchanged declarations for documents it no longer discovers.

## Put declarations in another directory

```json
{
  "include": ["templates/**/*.mdt"],
  "types": {
    "outDir": ".generated"
  }
}
```

The directory structure stays the same:

```text
templates/notice.mdt
.generated/templates/notice.d.mdt.ts
```

Tell TypeScript to resolve those directories together:

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",
    "allowArbitraryExtensions": true,
    "customConditions": ["browser"],
    "rootDirs": [".", ".generated"]
  },
  "include": ["src", "templates", ".generated"]
}
```

## Validate interactive input

```ts
import notice from "./notice.mdt";

const result = await notice.standard.validate({
  service: "Asset API",
  version: "2.0.0",
  changes: [
    {
      title: "Resumable uploads",
      description: "Continue an interrupted upload without starting over.",
    },
  ],
});

if (result.issues) {
  console.log(result.issues);
} else {
  const markdown = notice.renderValidated(result.value);
  console.log(markdown);
}
```

An application can show the issues beside its controls and render only validated values.
The example app calls `render`, which validates its input before rendering.

Templates execute authored expressions. Use templates from authors you trust.
