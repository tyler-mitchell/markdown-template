import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { defineExtension } from "lexical";
import { TemplateExtension, $importDocument, $exportDocument } from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { TemplateSuggestions } from "./template-suggestions";

export function DocumentEditor({
  initialDocument,
  onChange,
}: {
  initialDocument: CompiledDocument;
  onChange?: (source: string) => void;
}) {
  const [extension] = useState(() =>
    defineExtension({
      name: "example/document-editor",
      dependencies: [TemplateExtension],
      $initialEditorState: () => $importDocument(initialDocument),
    }),
  );
  return (
    <div className="mdt-editor">
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        {onChange && <DocumentChanges onChange={onChange} />}
        <TemplateSuggestions document={initialDocument} />
        <ContentEditable
          className="mdt-editor-content prose prose-zinc dark:prose-invert"
          aria-label="Document"
        />
      </LexicalExtensionComposer>
    </div>
  );
}

function DocumentChanges({ onChange }: { onChange: (source: string) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size || dirtyLeaves.size) {
          onChange(editorState.read($exportDocument));
        }
      }),
    [editor, onChange],
  );

  return null;
}
