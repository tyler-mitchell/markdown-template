import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { defineExtension } from "lexical";
import { $exportDocument, $importDocument, TemplateExtension } from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";

export function TemplateEditor({
  document,
  onChange,
  editable = true,
}: {
  document: CompiledDocument;
  onChange?: (source: string) => void;
  editable?: boolean;
}) {
  const [extension] = useState(() =>
    defineExtension({
      name: "example/template-editor",
      dependencies: [TemplateExtension],
      editable,
      $initialEditorState: () => $importDocument(document),
    }),
  );
  return (
    <div className="mdt-editor">
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        {onChange && <DocumentChanges onChange={onChange} />}
        <ContentEditable className="mdt-editor-content" aria-label="Template document" />
      </LexicalExtensionComposer>
    </div>
  );
}

function DocumentChanges({ onChange }: { onChange: (source: string) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size || dirtyLeaves.size) onChange(editorState.read($exportDocument));
      }),
    [editor, onChange],
  );

  return null;
}
