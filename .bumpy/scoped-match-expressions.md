---
markdown-template: minor
---

Allow match cases to use inline ArkType expressions alongside schema module names, preserving authored case order and default selection.

`<$case type="number > 100">` can precede `<$case type="number">` in the same
match as a named `<$case type="Unavailable">`. Cases use native ArkType matching.

`test/match.test.ts` demonstrates frontmatter definitions and supplied modules,
overlapping numeric cases, named object cases, and a default.
