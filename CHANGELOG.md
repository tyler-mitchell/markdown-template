# Changelog

## 1.0.0
<sub>2026-11-04</sub>

- *(major)* Use double braces for text interpolation while retaining single-brace construct attributes.
- *(major)*
  Accept native ArkType modules, input exports, and included documents through compile options.

  Preserve native schema identity and inferred render arguments. Expose `standard`
  directly and add `renderValidated` for values already transformed by ArkType:

  ```ts
  const result = await document.standard.validate(raw);
  if (!result.issues) document.renderValidated(result.value);
  ```

  Compiled documents expose authored `children` ranges and `contentOffset`.
  Loaded documents also expose their resolved `file` path. Parser tokens and CST
  trees are no longer part of the compiled result; editors use public source ranges.

  Programmatic, Standard Schema, and editor tests demonstrate validation, defaults,
  transforms, composition, contextual controls, and source-preserving edits.
- *(minor)* Added Markdown document templates with schemas and declarative expressions.
- *(minor)*
  Add reserved `$schema` and `$frontmatter` bindings for native schema and document metadata.

  `{{ $frontmatter.title }}` reads the current document's title. Each included
  document owns its metadata bindings; supplied values cannot replace them.
- *(minor)*
  Support inline show and include constructs inside Markdown sentences, including omitted optional inputs and nested inline conditions.
- *(minor)*
  Allow match cases to use inline ArkType expressions alongside schema module names, preserving authored case order and default selection.

  `<$case type="number > 100">` can precede `<$case type="number">` in the same
  match as a named `<$case type="Unavailable">`. Cases use native ArkType matching.

  `test/match.test.ts` demonstrates frontmatter definitions and supplied modules,
  overlapping numeric cases, named object cases, and a default.
- *(minor)*
  Add browser compilation and Vite document imports through the package root. Export the patched native ArkType factory for code-defined schemas with metadata defaults.

  Browser builds need no Node `process` global. Consumer declarations no longer
  import Monogram's internal TypeScript source.

  The exported native `type` retains ArkType's declarations, including static
  module syntax and metadata defaults, without requiring consumer patches.

  Compiled documents expose their resolved `includes`. An editor can pass these
  dependencies back to `compile` after changing the source, including for Vite imports.

  Handle Vite's `?import` document requests while preserving its native `?raw`
  and `?url` imports.
- *(minor)*
  Add configuration-driven document discovery, inspection, rendering, and TypeScript declaration generation through the markdown-template CLI.

  Commands also work without a configuration file, using the current directory.
- *(minor)*
  Add raw file includes that preserve source text, including frontmatter and template syntax, and escape complete template directives in examples.
- *(minor)*
  Expose TemplateSyntaxError with the authored source range, line, column, and file name so editors can locate invalid directives and interpolations. Preserve the underlying parser error as the cause.
- *(patch)*
  Lead the README with a complete release-handoff template, its input, and its rendered Markdown; generate the documentation with MDT and verify escaped examples and literal inserted templates.
