import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { defineExtension } from "lexical";
import { MarkdownExtension } from "@markdown-template/lexical";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";

export function DocumentEditor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange?: (markdown: string) => void;
}) {
  const [extension] = useState(() =>
    defineExtension({
      name: "example/document-editor",
      dependencies: [MarkdownExtension],
      $initialEditorState: () => $convertFromMarkdownString(initialMarkdown),
    }),
  );
  return (
    <div className="mdt-editor">
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        {onChange && <DocumentChanges onChange={onChange} />}
        <ContentEditable
          className="mdt-editor-content prose prose-zinc dark:prose-invert"
          aria-label="Document"
        />
      </LexicalExtensionComposer>
    </div>
  );
}

function DocumentChanges({ onChange }: { onChange: (markdown: string) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size || dirtyLeaves.size) {
          onChange(editorState.read(() => $convertToMarkdownString()));
        }
      }),
    [editor, onChange],
  );

  return null;
}
