import { defineExtension } from "lexical";
import { HistoryExtension } from "@lexical/history";
import { LinkExtension } from "@lexical/link";
import { CheckListExtension, ListExtension } from "@lexical/list";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { RichTextExtension } from "@lexical/rich-text";
import { CodeExtension } from "./components/editor/extensions/code";
import { FormatStateExtension } from "./components/editor/extensions/format-state";
import { editorTheme } from "./components/editor/theme";

export const DocumentExtension = defineExtension({
  name: "@markdown-template/editor/Document",
  theme: editorTheme,
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    ListExtension,
    CheckListExtension,
    LinkExtension,
    CodeExtension,
    FormatStateExtension,
  ],
  register: (editor) => registerMarkdownShortcuts(editor, TRANSFORMERS),
});

export { DocumentEditor } from "./document-editor";
export { ContentEditable } from "./components/editor/plugins/content-editable";
export { DraggableBlockPlugin } from "./components/editor/plugins/draggable-block-plugin";
export { FloatingToolbarPlugin } from "./components/editor/plugins/floating/floating-toolbar-plugin";
export {
  ComponentPicker,
  useComponentPickerItems,
} from "./components/editor/plugins/component-picker/component-picker-plugin";
export { ParagraphPickerPlugin } from "./components/editor/plugins/component-picker/paragraph-picker-plugin";
export { HeadingPickerPlugin } from "./components/editor/plugins/component-picker/heading-picker-plugin";
export { BulletedListPickerPlugin } from "./components/editor/plugins/component-picker/bulleted-list-picker-plugin";
export { NumberedListPickerPlugin } from "./components/editor/plugins/component-picker/numbered-list-picker-plugin";
export { CheckListPickerPlugin } from "./components/editor/plugins/component-picker/check-list-picker-plugin";
export { QuotePickerPlugin } from "./components/editor/plugins/component-picker/quote-picker-plugin";
export { CodePickerPlugin } from "./components/editor/plugins/component-picker/code-picker-plugin";
