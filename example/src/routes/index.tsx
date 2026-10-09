import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { compile } from "markdown-template";
import source from "../../templates/notice.mdt?raw";
import release from "../../data/release.json";
import { TemplateEditor } from "#/components/template-editor";
import { DocumentPreview } from "#/components/document-preview";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Button } from "#/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Textarea } from "#/components/ui/textarea";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#/components/ui/field";

export const Route = createFileRoute("/")({ ssr: false, component: EditorPage });

const document = compile(source);

function EditorPage() {
  const [draft, setDraft] = useState(source);
  const [input, setInput] = useState(JSON.stringify(release, null, 2));
  const [preview, setPreview] = useState(false);
  const result = useMemo(() => {
    try {
      const compiled = compile(draft);
      return { document: compiled, markdown: compiled.render(JSON.parse(input)), error: undefined };
    } catch (error) {
      return {
        document: undefined,
        markdown: undefined,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [draft, input]);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="font-semibold">Release notice</h1>
          <p className="text-sm text-muted-foreground">
            Edit the document. Preview it with your release data.
          </p>
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
                  <FieldLabel htmlFor="release-data">Preview data</FieldLabel>
                  <FieldDescription>Checked against this template’s schema.</FieldDescription>
                  <Textarea
                    id="release-data"
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
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="55%" minSize="30%">
          <TemplateEditor document={document} onChange={setDraft} />
        </ResizablePanel>
        {preview && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="45%" minSize="25%">
              <section className="h-full overflow-auto" aria-label="Rendered document">
                {result.error ? (
                  <Alert variant="destructive" className="m-4 w-auto">
                    <AlertTitle>Preview needs attention</AlertTitle>
                    <AlertDescription>
                      <pre className="whitespace-pre-wrap">{result.error}</pre>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <DocumentPreview content={result.markdown!} />
                )}
              </section>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
}
