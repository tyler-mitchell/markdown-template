import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $create, configExtension, defineExtension } from "lexical";
import {
  TemplateExtension,
  TemplateInputNode,
  $importDocument,
  $exportDocument,
} from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { TemplateContext, ReactTemplateInputNode } from "./template-input";

export function DocumentEditor({
  initialDocument,
  onChange,
  trigger,
}: {
  initialDocument: CompiledDocument;
  onChange?: (source: string) => void;
  trigger?: string;
}) {
  const [extension] = useState(() =>
    defineExtension({
      name: "example/document-editor",
      dependencies: [
        trigger === undefined ? TemplateExtension : configExtension(TemplateExtension, { trigger }),
      ],
      nodes: [
        ReactTemplateInputNode,
        {
          replace: TemplateInputNode,
          with: (node: TemplateInputNode) =>
            $create(ReactTemplateInputNode).setFormat(node.getFormat()),
          withKlass: ReactTemplateInputNode,
        },
      ],
      $initialEditorState: () => $importDocument(initialDocument),
    }),
  );
  return (
    <div className="mdt-editor">
      <TemplateContext value={initialDocument}>
        <LexicalExtensionComposer extension={extension} contentEditable={null}>
          {onChange && <DocumentChanges onChange={onChange} />}
          <ContentEditable
            className="mdt-editor-content prose prose-zinc dark:prose-invert"
            aria-label="Document"
          />
        </LexicalExtensionComposer>
      </TemplateContext>
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
