# Markdown Template for Lexical

Edit MDT documents through a native Lexical extension. The host owns the UI,
storage, input values, and evaluated preview.

```tsx
import { defineExtension } from "lexical";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { compile } from "markdown-template";
import {
  TemplateExtension,
  $importDocument,
} from "@markdown-template/lexical";
import source from "./release-notice.mdt?raw";

const extension = defineExtension({
  name: "app/release-notice",
  dependencies: [TemplateExtension],
  $initialEditorState: () => $importDocument(compile(source)),
});

export function ReleaseNotice() {
  return <LexicalExtensionComposer extension={extension} />;
}
```

The extension reference must stay stable. Lexical owns the editor lifecycle,
selection, editing transactions, and undo history.

Export source inside a Lexical read:

```ts
import { $exportDocument } from "@markdown-template/lexical";

const source = editor.getEditorState().read($exportDocument);
const markdown = compile(source).render(releaseData);
```

`$exportDocument` returns the template, including frontmatter and expressions.
Rendering with values is a separate operation.

Lexical normalizes Markdown formatting, including list indentation. Frontmatter
and template expressions remain source text.

The package contains no React components, stylesheets, routing, or file access.
The Start app in `example/` supplies the presentation.
