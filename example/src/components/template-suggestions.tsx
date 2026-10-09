import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuResolution,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode } from "lexical";
import { $createTemplateExpression } from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { badgeVariants } from "#/components/ui/badge";

class FieldOption extends MenuOption {
  constructor(
    readonly field: string,
    readonly description: string,
    readonly expression: string,
  ) {
    super(field);
  }
}

function matchReference(text: string) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const node = selection.anchor.getNode();
  if (
    !$isTextNode(node) ||
    node.hasFormat("code") ||
    node.getParents().some((parent) => parent.getType() === "code")
  )
    return null;
  const match = /\{\{\s*([$\w.]*)$/.exec(text);
  return match
    ? { leadOffset: match.index, matchingString: match[1], replaceableString: match[0] }
    : null;
}

export function TemplateSuggestions({ document }: { document: CompiledDocument }) {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const pending = useRef<{ key: string; style: string } | null>(null);
  const dismissed = useRef<string | null>(null);
  const trigger = useCallback((text: string) => {
    const match = matchReference(text);
    if (!match) dismissed.current = null;
    return match?.replaceableString === dismissed.current ? null : match;
  }, []);
  const options = useMemo(() => {
    type Schema = Pick<NonNullable<CompiledDocument["input"]>["out"], "select">;
    const fields = (schema: Schema) => [
      ...schema.select({ kind: "required", boundary: "shallow" }),
      ...schema.select({ kind: "optional", boundary: "shallow" }),
    ];
    const path = (query ?? "").split(".");
    const prefix = path.slice(0, -1);
    const schema = prefix.reduce<Schema | undefined>(
      (schema, key) => schema && fields(schema).find((field) => field.key === key)?.value,
      document.input?.out,
    );
    if (!schema) return [];
    return fields(schema)
      .filter((field) => typeof field.key === "string" && field.key.startsWith(path.at(-1) ?? ""))
      .map(
        (field) =>
          new FieldOption(
            [...prefix, String(field.key)].join("."),
            field.value.meta.description ?? "",
            field.value.expression,
          ),
      );
  }, [document, query]);

  const clearPending = useCallback(() => {
    const previous = pending.current;
    pending.current = null;
    if (!previous) return;
    editor.update(
      () => {
        const node = $getNodeByKey(previous.key);
        if ($isTextNode(node)) {
          dismissed.current = matchReference(node.getTextContent())?.replaceableString ?? null;
          node.setStyle(previous.style);
        }
        const selection = $getSelection();
        if ($isRangeSelection(selection)) selection.setStyle(previous.style);
      },
      { discrete: true },
    );
  }, [editor]);

  const showPending = useCallback(
    (resolution: MenuResolution) => {
      if (!resolution.match) return;
      dismissed.current = null;
      const { leadOffset } = resolution.match;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const node = selection.anchor.getNode();
        if (!$isTextNode(node)) return;
        const fragment = node.splitText(leadOffset, selection.anchor.offset)[leadOffset ? 1 : 0];
        pending.current = { key: fragment.getKey(), style: fragment.getStyle() };
        fragment.setStyle(
          `${fragment.getStyle()};background-color:var(--accent);border-radius:var(--radius);box-shadow:0 0 0 1px var(--border)`,
        );
        selection.setStyle(fragment.getStyle());
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin
      triggerFn={trigger}
      onQueryChange={setQuery}
      onOpen={showPending}
      onClose={clearPending}
      options={options}
      onSelectOption={(option, node, close) => {
        if (!node) return;
        const badge = $createTemplateExpression(`{{ ${option.field} }}`).setFormat(
          node.getFormat(),
        );
        node.replace(badge);
        badge.selectNext();
        close();
      }}
      menuRenderFn={(anchor, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
        anchor.current &&
        createPortal(
          <div className="mt-2 w-80 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
            <ul role="listbox" aria-label="Template fields" className="max-h-64 overflow-auto">
              {options.map((option, index) => (
                <li
                  key={option.key}
                  id={`typeahead-item-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  ref={option.setRefElement}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOptionAndCleanUp(option)}
                  className="cursor-pointer rounded-md px-3 py-2 aria-selected:bg-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={badgeVariants({ variant: "secondary" })}>{option.field}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {option.expression}
                    </span>
                  </div>
                  {option.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  )}
                </li>
              ))}
              {!options.length && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matching fields</li>
              )}
            </ul>
          </div>,
          anchor.current,
        )
      }
    />
  );
}
