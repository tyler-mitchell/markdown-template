import { $isCodeNode, CodeExtension } from "@lexical/code";
import { HistoryExtension } from "@lexical/history";
import { LinkExtension } from "@lexical/link";
import { ListExtension } from "@lexical/list";
import { RichTextExtension } from "@lexical/rich-text";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { DecoratorTextExtension } from "@lexical/extension";
import {
  $create,
  $createTextNode,
  $getSelection,
  $getState,
  $getNearestNodeFromDOMNode,
  $isRangeSelection,
  $isTextNode,
  defineExtension,
  mergeRegister,
  TextNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { compile } from "markdown-template";
import {
  $createTemplateExpression,
  $editTemplateExpression,
  sourceState,
  TemplateBlockNode,
  TemplateBodyNode,
  TemplateSourceNode,
  TemplateInputNode,
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
  config: { trigger: "{{", expressions: true },
  dependencies: [DecoratorTextExtension],
  nodes: [TemplateBlockNode, TemplateBodyNode, TemplateSourceNode, TemplateInputNode],
  register(editor, { trigger, expressions }) {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const node = $getNearestNodeFromDOMNode(event.target as Node);
          if (!(node instanceof TemplateSourceNode) || !$getState(node, sourceState)) return false;
          event.preventDefault();
          $editTemplateExpression(node);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerNodeTransform(TextNode, (node) => {
        if (!node.isSimpleText() || node.hasFormat("code") || $isCodeNode(node.getParent())) return;
        const selection = $getSelection();
        if (
          trigger &&
          $isRangeSelection(selection) &&
          selection.isCollapsed() &&
          selection.anchor.key === node.getKey() &&
          node.getTextContent().slice(0, selection.anchor.offset).endsWith(trigger)
        ) {
          const end = selection.anchor.offset;
          const start = end - trigger.length;
          const fragment = node.splitText(start, end)[start ? 1 : 0];
          const input = $create(TemplateInputNode).setFormat(node.getFormat());
          fragment.replace(input);
          input.selectNext();
          return;
        }
        if (!expressions) return;
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
