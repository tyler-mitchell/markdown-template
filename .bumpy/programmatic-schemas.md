---
markdown-template: major
---

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
