# Document editor

An inline document surface composed from
[shadcn-editor](https://github.com/htmujahid/shadcn-editor)'s MIT-licensed registry.
It provides slash insertion, draggable blocks, and selection formatting.
There is no permanent toolbar.

```tsx
import { defineExtension } from "lexical";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { DocumentEditor, DocumentExtension } from "@markdown-template/editor";
import "@markdown-template/editor/styles.css";

const extension = defineExtension({
  name: "app/document",
  dependencies: [DocumentExtension],
});

export function Notes() {
  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <DocumentEditor />
    </LexicalExtensionComposer>
  );
}
```

The host supplies Tailwind and shadcn theme tokens. Add domain extensions through
Lexical's `dependencies` and React plugins through `DocumentEditor`'s children.
The editor has no dependency on MDT, persistence, or transport.

## Registry source

Components were installed through the shadcn CLI from the `editor-x` registry
item. Only the document plugins and their dependencies are included.
Lexical dependencies use the workspace's 0.52 version. Theme CSS is imported
through `styles.css`.
