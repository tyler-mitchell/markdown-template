import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type } from "markdown-template";
import release from "../../data/release.json";
import { DocumentPreview } from "#/components/document-preview";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { Badge } from "#/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";

const renderInput = type({ values: { "[string]": "unknown" } });

const renderNotice = createServerFn({ method: "POST" })
  .validator(renderInput)
  .handler(async ({ data }) => {
    const { load } = await import("markdown-template");
    const document = await load({ file: "templates/notice.mdt" });
    return { markdown: document.render(data.values), file: "templates/notice.mdt" };
  });

export const Route = createFileRoute("/server")({ component: ServerPage });

function ServerPage() {
  const [input, setInput] = useState(JSON.stringify(release, null, 2));
  const render = useMutation({
    mutationFn: () => renderNotice({ data: { values: JSON.parse(input) } }),
  });
  return (
    <main className="min-h-0 flex-1 overflow-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Release notice</h1>
            <p className="mt-2 text-muted-foreground">
              Resolve this template from its file on the server.
            </p>
          </div>
          <Badge variant="outline">Start server function</Badge>
        </header>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Data
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(28rem,calc(100vw-2rem))]" align="start">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="server-input">Release data</FieldLabel>
                  <Textarea
                    id="server-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="min-h-80 font-mono text-sm"
                    spellCheck={false}
                  />
                </Field>
              </FieldGroup>
            </PopoverContent>
          </Popover>
          <Button size="sm" disabled={render.isPending} onClick={() => render.mutate()}>
            {render.isPending ? "Rendering…" : "Render on server"}
          </Button>
        </div>
        <section aria-label="Server result">
          {render.data ? (
            <DocumentPreview content={render.data.markdown} />
          ) : (
            <p className="p-6 text-muted-foreground">
              Render the release data to see the returned document.
            </p>
          )}
        </section>
        {render.error && (
          <Alert variant="destructive">
            <AlertTitle>Could not render this data</AlertTitle>
            <AlertDescription>{render.error.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}
