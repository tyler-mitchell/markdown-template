import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import notice from "../../templates/notice.mdt";
import handoff from "../../templates/release-handoff.mdt";
import deployment from "../../templates/deployment/workflow.mdt";
import release from "../../data/release.json";
import handoffData from "../../data/release-handoff.json";
import deploymentData from "../../data/deployment.json";
import { DocumentEditor } from "#/components/document-editor";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";

export const Route = createFileRoute("/")({ ssr: false, component: EditorPage });

const examples = [
  { id: "notice", document: notice, markdown: notice.render(release) },
  {
    id: "handoff",
    document: handoff,
    markdown: handoff.renderValidated(handoff.input.assert(handoffData)),
  },
  { id: "deployment", document: deployment, markdown: deployment.render(deploymentData) },
];

function EditorPage() {
  const [selected, setSelected] = useState("notice");
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="px-6 py-3">
        <NativeSelect
          size="sm"
          aria-label="Document"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {examples.map(({ id, document }) => (
            <NativeSelectOption key={id} value={id}>
              {String(document.frontmatter.title)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {examples.map(({ id, markdown }) => (
        <div key={id} hidden={selected !== id} className="min-h-0 flex-1 overflow-auto">
          <DocumentEditor initialMarkdown={markdown} />
        </div>
      ))}
    </main>
  );
}
