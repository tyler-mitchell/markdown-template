import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { defineExtension } from "lexical";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { DocumentEditor, DocumentExtension } from "@markdown-template/editor";
import notes from "../../documents/release-plan.md?raw";
import notice from "../../templates/notice.mdt";
import handoff from "../../templates/release-handoff.mdt";
import deployment from "../../templates/deployment/workflow.mdt";
import { TemplateEditor } from "#/components/template-editor";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";

export const Route = createFileRoute("/")({ ssr: false, component: EditorPage });

const examples = [
  { id: "notice", document: notice },
  { id: "handoff", document: handoff },
  { id: "deployment", document: deployment },
];

const notesExtension = defineExtension({
  name: "example/notes",
  dependencies: [DocumentExtension],
  $initialEditorState: () => $convertFromMarkdownString(notes, TRANSFORMERS),
});

function EditorPage() {
  const [selected, setSelected] = useState("notes");
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="px-6 py-3">
        <NativeSelect
          size="sm"
          aria-label="Document"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <NativeSelectOption value="notes">Project notes</NativeSelectOption>
          {examples.map(({ id, document }) => (
            <NativeSelectOption key={id} value={id}>
              {String(document.frontmatter.title)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div hidden={selected !== "notes"} className="min-h-0 flex-1 overflow-auto">
        <LexicalExtensionComposer extension={notesExtension} contentEditable={null}>
          <DocumentEditor />
        </LexicalExtensionComposer>
      </div>
      {examples.map(({ id, document }) => (
        <div key={id} hidden={selected !== id} className="min-h-0 flex-1 overflow-auto">
          <TemplateEditor document={document} />
        </div>
      ))}
    </main>
  );
}
