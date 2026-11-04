import type { ComponentProps, ReactNode } from "react";
import { ContentEditable } from "./components/editor/plugins/content-editable";
import { DraggableBlockPlugin } from "./components/editor/plugins/draggable-block-plugin";
import { FloatingToolbarPlugin } from "./components/editor/plugins/floating/floating-toolbar-plugin";
import { ComponentPicker } from "./components/editor/plugins/component-picker/component-picker-plugin";
import { HeadingPickerPlugin } from "./components/editor/plugins/component-picker/heading-picker-plugin";
import { ParagraphPickerPlugin } from "./components/editor/plugins/component-picker/paragraph-picker-plugin";
import { BulletedListPickerPlugin } from "./components/editor/plugins/component-picker/bulleted-list-picker-plugin";
import { NumberedListPickerPlugin } from "./components/editor/plugins/component-picker/numbered-list-picker-plugin";
import { CheckListPickerPlugin } from "./components/editor/plugins/component-picker/check-list-picker-plugin";
import { QuotePickerPlugin } from "./components/editor/plugins/component-picker/quote-picker-plugin";
import { CodePickerPlugin } from "./components/editor/plugins/component-picker/code-picker-plugin";
import { TooltipProvider } from "./components/ui/tooltip";

/** Compose inside LexicalExtensionComposer with DocumentExtension. */
export function DocumentEditor({
  children = (
    <>
      <DraggableBlockPlugin />
      <FloatingToolbarPlugin formats={["bold", "italic", "strikethrough", "code"]} />
      <ComponentPicker>
        <ParagraphPickerPlugin />
        <HeadingPickerPlugin />
        <BulletedListPickerPlugin />
        <NumberedListPickerPlugin />
        <CheckListPickerPlugin />
        <QuotePickerPlugin />
        <CodePickerPlugin />
      </ComponentPicker>
    </>
  ),
  ...contentEditableProps
}: {
  children?: ReactNode;
} & ComponentProps<typeof ContentEditable>) {
  return (
    <TooltipProvider>
      <div className="relative mx-auto min-h-full max-w-3xl py-8">
        <ContentEditable
          variant="draggable"
          aria-label="Document"
          placeholder={{ en: "Start writing, or type / for blocks…" }}
          {...contentEditableProps}
        />
        {children}
      </div>
    </TooltipProvider>
  );
}
