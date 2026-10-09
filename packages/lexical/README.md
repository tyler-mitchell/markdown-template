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
import source from "./notice.mdt?raw";

const document = compile(source);
const extension = defineExtension({
  name: "app/release-notice",
  dependencies: [TemplateExtension],
  $initialEditorState: () => $importDocument(document),
});

export function ReleaseNotice() {
  return <LexicalExtensionComposer extension={extension} />;
}
```

The extension reference must stay stable. Lexical owns the editor lifecycle,
selection, editing transactions, and undo history.

Text, expressions, and directive lines are editable in the document.
Markdown shortcuts provide headings, lists, and inline formatting.
Typed and pasted template syntax uses the compiler's source boundaries.
Incomplete syntax stays editable; inline code keeps Lexical's normal handling.

Export source inside a Lexical read:

```ts
import { $exportDocument } from "@markdown-template/lexical";

const source = editor.getEditorState().read($exportDocument);
const markdown = compile(source).render(releaseData);
```

`$exportDocument` returns the template, including frontmatter and expressions.
Rendering with values is a separate operation.

## Source ownership

`$initialEditorState` imports the starting document once. During editing,
Lexical owns the draft and selection. The host exports source from update
listeners and recompiles it for validation or preview.

For an explicit update from a file or agent, use the same editor. React hosts
obtain it through `useLexicalComposerContext`.

```ts
import { HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG } from "lexical";
import { compile } from "markdown-template";
import { $importDocument } from "@markdown-template/lexical";

const updatedSource = document.source.replace("This release includes:", "Ready for your team:");
const updated = compile(updatedSource, { includes: document.includes });
editor.update(() => $importDocument(updated), {
  tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG],
});
```

This replaces the draft in one undo step without moving browser focus.
The host decides when to apply it. Do not re-import source after every keystroke.

Lexical normalizes Markdown formatting, including list indentation. Frontmatter
and template expressions remain source text.

The package contains no React components, stylesheets, routing, or file access.
`MarkdownExtension` supplies the same native formatting and history without
template syntax handling. The Start example uses it to edit rendered Markdown.
