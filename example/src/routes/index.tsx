import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { compile, TemplateSyntaxError } from "markdown-template";
import notice from "../../templates/notice.mdt";
import handoff from "../../templates/release-handoff.mdt";
import deployment from "../../templates/deployment/workflow.mdt";
import release from "../../data/release.json";
import handoffData from "../../data/release-handoff.json";
import deploymentData from "../../data/deployment.json";
import { TemplateEditor } from "#/components/template-editor";
import { DocumentPreview } from "#/components/document-preview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Button } from "#/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Textarea } from "#/components/ui/textarea";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#/components/ui/field";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";

export const Route = createFileRoute("/")({ ssr: false, component: EditorPage });

const examples = [
  { id: "notice", document: notice, values: release },
  { id: "handoff", document: handoff, values: handoffData },
  { id: "deployment", document: deployment, values: deploymentData },
];

function EditorPage() {
  const [selected, setSelected] = useState("notice");
  return examples.map((example) => (
    <div key={example.id} hidden={selected !== example.id} className="min-h-0 flex-1">
      <EditorDocument example={example} onSelect={setSelected} />
    </div>
  ));
}

function EditorDocument({
  example,
  onSelect,
}: {
  example: (typeof examples)[number];
  onSelect: (id: string) => void;
}) {
  const { document } = example;
  const [draft, setDraft] = useState(document.source);
  const [input, setInput] = useState(JSON.stringify(example.values, null, 2));
  const [preview, setPreview] = useState(false);
  const result = useMemo(() => {
    try {
      const compiled = compile(draft, { includes: document.includes });
      return { markdown: compiled.render(JSON.parse(input)), error: undefined };
    } catch (error) {
      return {
        markdown: undefined,
        error: error instanceof Error ? error.message : String(error),
        source:
          error instanceof TemplateSyntaxError ? draft.slice(error.offset, error.end) : undefined,
      };
    }
  }, [draft, input, document]);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-6 py-3">
        <div>
          <NativeSelect
            size="sm"
            aria-label="Template"
            value={example.id}
            onChange={(event) => onSelect(event.target.value)}
          >
            {examples.map(({ id, document }) => (
              <NativeSelectOption key={id} value={id}>
                {String(document.frontmatter.title)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                Data
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(28rem,calc(100vw-2rem))]" align="end">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`${example.id}-data`}>Preview data</FieldLabel>
                  <FieldDescription>Checked against this template’s schema.</FieldDescription>
                  <Textarea
                    id={`${example.id}-data`}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="min-h-64 font-mono text-sm"
                    spellCheck={false}
                  />
                </Field>
              </FieldGroup>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                Source
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-h-[70vh] w-[min(36rem,calc(100vw-2rem))] overflow-auto"
              align="end"
            >
              <pre className="whitespace-pre-wrap text-xs">{draft}</pre>
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            variant={preview ? "secondary" : "outline"}
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            Preview
          </Button>
        </div>
      </div>
      {result.error && (
        <Alert variant="destructive" className="mx-6 my-3 w-auto">
          <AlertTitle>Preview needs attention</AlertTitle>
          <AlertDescription>
            <pre className="whitespace-pre-wrap">{result.error}</pre>
            {result.source && <code className="whitespace-pre-wrap">{result.source}</code>}
          </AlertDescription>
        </Alert>
      )}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="55%" minSize="30%">
          <TemplateEditor initialDocument={document} onChange={setDraft} />
        </ResizablePanel>
        {preview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="45%" minSize="25%">
              <section className="h-full overflow-auto" aria-label="Rendered document">
                {result.markdown !== undefined && <DocumentPreview content={result.markdown} />}
              </section>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
}
