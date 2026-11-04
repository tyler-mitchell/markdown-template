---
markdown-template: minor
---

Add browser compilation and Vite document imports through the package root. Export the patched native ArkType factory for code-defined schemas with metadata defaults.

Browser builds need no Node `process` global. Consumer declarations no longer
import Monogram's internal TypeScript source.

The exported native `type` retains ArkType's declarations, including static
module syntax and metadata defaults, without requiring consumer patches.

Compiled documents expose their resolved `includes`. An editor can pass these
dependencies back to `compile` after changing the source, including for Vite imports.

Handle Vite's `?import` document requests while preserving its native `?raw`
and `?url` imports.
