import { CodeExtension } from "@lexical/code";
import { HistoryExtension } from "@lexical/history";
import { LinkExtension } from "@lexical/link";
import { ListExtension } from "@lexical/list";
import { RichTextExtension } from "@lexical/rich-text";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { defineExtension } from "lexical";
import {
  TemplateBlockNode,
  TemplateBodyNode,
  TemplateExpressionNode,
  TemplateSourceNode,
} from "./nodes";

/** Native Lexical behavior and nodes for editing MDT documents. */
export const TemplateExtension = defineExtension({
  name: "@markdown-template/lexical/Template",
  dependencies: [RichTextExtension, HistoryExtension, ListExtension, LinkExtension, CodeExtension],
  nodes: [TemplateBlockNode, TemplateBodyNode, TemplateExpressionNode, TemplateSourceNode],
  register(editor) {
    return registerMarkdownShortcuts(editor, TRANSFORMERS);
  },
});
