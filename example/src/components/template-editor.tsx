import { useEffect, useRef, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { DocumentEditor, DocumentExtension } from "@markdown-template/editor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import {
  $create,
  configExtension,
  defineExtension,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
} from "lexical";
import {
  TemplateExtension,
  TemplateInputNode,
  $importDocument,
  $exportDocument,
} from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { TemplateContext, ReactTemplateInputNode } from "./template-input";

export function TemplateEditor({
  document,
  onChange,
  trigger,
}: {
  document: CompiledDocument;
  onChange?: (source: string) => void;
  trigger?: string;
}) {
  const [extension] = useState(() =>
    defineExtension({
      name: "example/document-editor",
      dependencies: [
        DocumentExtension,
        trigger === undefined ? TemplateExtension : configExtension(TemplateExtension, { trigger }),
      ],
      nodes: [
        ReactTemplateInputNode,
        {
          replace: TemplateInputNode,
          with: (node: TemplateInputNode) =>
            $create(ReactTemplateInputNode).updateFromJSON(node.exportJSON()),
          withKlass: ReactTemplateInputNode,
        },
      ],
      $initialEditorState: () => $importDocument(document),
    }),
  );
  return (
    <TemplateContext value={document}>
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        <TemplateDocumentPlugin document={document} onChange={onChange} />
        <DocumentEditor />
      </LexicalExtensionComposer>
    </TemplateContext>
  );
}

const DOCUMENT_UPDATE_TAG = "mdt:document";

export function TemplateDocumentPlugin({
  document,
  onChange,
}: {
  document: CompiledDocument;
  onChange?: (source: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const source = useRef(document.source);
  useEffect(() => {
    if (source.current === document.source) return;
    source.current = document.source;
    editor.update(() => $importDocument(document), {
      tag: [DOCUMENT_UPDATE_TAG, HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG],
    });
  }, [document, editor]);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      ignoreHistoryMergeTagChange={false}
      onChange={(editorState, _editor, tags) => {
        if (tags.has(DOCUMENT_UPDATE_TAG)) return;
        const next = editorState.read($exportDocument);
        if (next === source.current) return;
        source.current = next;
        onChange?.(next);
      }}
    />
  );
}
