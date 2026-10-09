import { useEffect, useState } from "react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  defineExtension,
} from "lexical";
import {
  $exportDocument,
  $importDocument,
  TemplateExpressionNode,
  TemplateExtension,
} from "@markdown-template/lexical";
import type { CompiledDocument } from "markdown-template";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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
        {editable && <ExpressionEditor document={document} />}
        <ContentEditable className="mdt-editor-content" aria-label="Template document" />
      </LexicalExtensionComposer>
    </div>
  );
}

function ExpressionEditor({ document }: { document: CompiledDocument }) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected] = useState<{
    key: string;
    expression: string;
    element: HTMLElement;
  } | null>(null);
  const [expression, setExpression] = useState("");
  useEffect(
    () =>
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const node = $getNearestNodeFromDOMNode(event.target as Node);
          if (!(node instanceof TemplateExpressionNode)) return false;
          const element = editor.getElementByKey(node.getKey());
          if (!element) return false;
          setSelected({ key: node.getKey(), expression: node.getExpression(), element });
          setExpression(node.getExpression());
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor],
  );

  const properties = [
    ...(document.input?.out.select({ kind: "required", boundary: "shallow" }) ?? []),
    ...(document.input?.out.select({ kind: "optional", boundary: "shallow" }) ?? []),
  ];
  const property = properties.find((property) => property.key === selected?.expression);

  return (
    <Popover
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) setSelected(null);
      }}
    >
      {selected && <PopoverAnchor virtualRef={{ current: selected.element }} />}
      <PopoverContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          editor.focus();
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            editor.update(() => {
              const node = $getNodeByKey(selected.key);
              if (node instanceof TemplateExpressionNode) node.setExpression(expression);
            });
            setSelected(null);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="expression">Expression</FieldLabel>
              <Input
                id="expression"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {property?.value.meta.description && (
                <FieldDescription>{property.value.meta.description}</FieldDescription>
              )}
            </Field>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </FieldGroup>
        </form>
      </PopoverContent>
    </Popover>
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
