import { $isCodeNode, CodeExtension } from "@lexical/code";
import { HistoryExtension } from "@lexical/history";
import { LinkExtension } from "@lexical/link";
import { ListExtension } from "@lexical/list";
import { RichTextExtension } from "@lexical/rich-text";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import {
  $create,
  $createTextNode,
  $isTextNode,
  defineExtension,
  mergeRegister,
  TextNode,
} from "lexical";
import { compile } from "markdown-template";
import { $getState } from "lexical";
import {
  $createTemplateExpression,
  sourceState,
  TemplateBlockNode,
  TemplateBodyNode,
  TemplateSourceNode,
} from "./nodes";

function getMatch(source: string) {
  try {
    const document = compile(source);
    const part = document.children[0];
    return part
      ? { start: document.contentOffset + part.offset, end: document.contentOffset + part.end }
      : null;
  } catch {
    return null;
  }
}

/** Native Markdown editing, formatting shortcuts, and undo history. */
export const MarkdownExtension = defineExtension({
  name: "@markdown-template/lexical/Markdown",
  dependencies: [RichTextExtension, HistoryExtension, ListExtension, LinkExtension, CodeExtension],
  register: (editor) => registerMarkdownShortcuts(editor, TRANSFORMERS),
});

/** Native Lexical behavior and nodes for editing MDT documents. */
export const TemplateExtension = defineExtension({
  name: "@markdown-template/lexical/Template",
  dependencies: [MarkdownExtension],
  nodes: [TemplateBlockNode, TemplateBodyNode, TemplateSourceNode],
  register(editor) {
    return mergeRegister(
      editor.registerNodeTransform(TextNode, (node) => {
        if (!node.isSimpleText() || node.hasFormat("code") || $isCodeNode(node.getParent())) return;
        const match = getMatch(node.getTextContent());
        if (!match) return;
        const fragment = node.splitText(match.start, match.end)[match.start === 0 ? 0 : 1];
        if (fragment.getTextContent().startsWith("{{")) {
          fragment.replace(
            $createTemplateExpression(fragment.getTextContent()).setFormat(node.getFormat()),
          );
          return;
        }
        fragment.replace(
          $create(TemplateSourceNode)
            .setTextContent(fragment.getTextContent())
            .setFormat(fragment.getFormat())
            .setStyle(fragment.getStyle())
            .setDetail(fragment.getDetail()),
        );
      }),
      editor.registerNodeTransform(TemplateSourceNode, (node) => {
        if ($getState(node, sourceState)) return;
        const source = node.getTextContent();
        const next = node.getNextSibling();
        if (
          $isTextNode(next) &&
          next.getFormat() === node.getFormat() &&
          next.getStyle() === node.getStyle()
        ) {
          const combined = getMatch(source + next.getTextContent());
          if (combined?.start === 0 && combined.end > source.length) {
            node.mergeWithSibling(next.splitText(combined.end - source.length)[0]);
            return;
          }
        }
        const match = getMatch(source);
        if (node.hasFormat("code") || !match || match.start !== 0) {
          node.replace(
            $createTextNode(source)
              .setFormat(node.getFormat())
              .setStyle(node.getStyle())
              .setDetail(node.getDetail()),
          );
        } else if (match.end < source.length) {
          node.splitText(match.end);
        }
      }),
    );
  },
});
