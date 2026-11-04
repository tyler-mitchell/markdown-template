---
markdown-template: minor
---

Add reserved `$schema` and `$frontmatter` bindings for native schema and document metadata.

`{{ $frontmatter.title }}` reads the current document's title. Each included
document owns its metadata bindings; supplied values cannot replace them.
