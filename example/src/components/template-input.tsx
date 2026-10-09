import { createContext, useContext, useMemo, useRef, useState } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, SKIP_DOM_SELECTION_TAG } from "lexical";
import { $createTemplateExpression, TemplateInputNode } from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { Command } from "cmdk";
import { badgeVariants } from "#/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "#/components/ui/popover";

export const TemplateContext = createContext<CompiledDocument | null>(null);

export class ReactTemplateInputNode extends TemplateInputNode {
  $config() {
    return this.config("mdt-input-react", { extends: TemplateInputNode });
  }

  decorate() {
    return <TemplateInput nodeKey={this.getKey()} />;
  }
}

function TemplateInput({ nodeKey }: { nodeKey: string }) {
  const [editor] = useLexicalComposerContext();
  const document = useContext(TemplateContext)!;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const options = useMemo(() => {
    type Schema = Pick<NonNullable<CompiledDocument["input"]>["out"], "select">;
    const fields = (schema: Schema) => [
      ...schema.select({ kind: "required", boundary: "shallow" }),
      ...schema.select({ kind: "optional", boundary: "shallow" }),
    ];
    const path = query.split(".");
    const prefix = path.slice(0, -1);
    const schema = prefix.reduce<Schema | undefined>(
      (schema, key) => schema && fields(schema).find((field) => field.key === key)?.value,
      document.input?.out,
    );
    if (!schema) return [];
    return fields(schema)
      .filter((field) => typeof field.key === "string" && field.key.startsWith(path.at(-1) ?? ""))
      .map((field) => ({
        path: [...prefix, String(field.key)].join("."),
        description: field.value.meta.description,
        expression: field.value.expression,
      }));
  }, [document, query]);

  const cancel = (focus: boolean) =>
    editor.update(
      () => {
        const input = $getNodeByKey(nodeKey);
        if (!input) return;
        if (focus) input.selectPrevious();
        input.remove();
      },
      { tag: focus ? undefined : SKIP_DOM_SELECTION_TAG },
    );

  const select = (field: string) =>
    editor.update(() => {
      const input = $getNodeByKey(nodeKey);
      if (!(input instanceof TemplateInputNode)) return;
      const badge = $createTemplateExpression(`{{ ${field} }}`).setFormat(input.getFormat());
      input.replace(badge);
      badge.selectNext();
    });

  useHotkey("Tab", () => select(selected), {
    target: inputRef,
    enabled: !!selected,
    ignoreInputs: false,
  });
  useHotkey("Escape", () => cancel(true), { target: inputRef });

  return (
    <Popover open>
      <Command
        label="Template fields"
        shouldFilter={false}
        value={selected}
        onValueChange={setSelected}
        className="inline"
      >
        <PopoverAnchor asChild>
          <Command.Input
            ref={inputRef}
            autoFocus
            aria-label="Template field"
            value={query}
            onValueChange={setQuery}
            className="mdt-template-input"
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-80 p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target !== inputRef.current) cancel(false);
          }}
        >
          <Command.List className="max-h-64 overflow-auto">
            <Command.Empty className="px-3 py-2 text-sm text-muted-foreground">
              No matching fields
            </Command.Empty>
            {options.map((option) => (
              <Command.Item
                key={option.path}
                value={option.path}
                onSelect={select}
                onMouseDown={(event) => event.preventDefault()}
                className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={badgeVariants({ variant: "secondary" })}>{option.path}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {option.expression}
                  </span>
                </div>
                {option.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                )}
              </Command.Item>
            ))}
          </Command.List>
        </PopoverContent>
      </Command>
    </Popover>
  );
}
