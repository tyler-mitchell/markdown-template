import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import { $create, $getRoot, $getState, $isTextNode, $setState } from "lexical";
import { $isCodeNode } from "@lexical/code";
import MarkdownIt from "markdown-it";
import { compile, type CompiledDocument } from "markdown-template";
import {
  frontmatterState,
  indentState,
  sourceState,
  closingState,
  labelState,
  $createTemplateExpression,
  TemplateBlockNode,
  TemplateBodyNode,
  TemplateSourceNode,
  TemplateInputNode,
} from "./nodes";

const markdown = new MarkdownIt();

const templateExport: Transformer[] = [
  {
    type: "multiline-element",
    dependencies: [TemplateBlockNode],
    regExpStart: /$^/,
    replace: () => false,
    export(node) {
      if (!(node instanceof TemplateBlockNode)) return null;
      const padding = " ".repeat($getState(node, indentState));
      const body = node
        .getChildren()
        .map((child) =>
          child instanceof TemplateBodyNode
            ? $convertToMarkdownString(templateExport, child, true)
                .replace(/^(?=.)/gm, padding)
                .replace(/\n$/, "")
            : child.getTextContent(),
        )
        .join("\n");
      return [$getState(node, sourceState), body, $getState(node, closingState)].join("\n");
    },
  },
  {
    type: "text-match",
    dependencies: [TemplateSourceNode, TemplateInputNode],
    regExp: /$^/,
    export(node, _children, exportFormat) {
      if (node instanceof TemplateInputNode) return "";
      if (!(node instanceof TemplateSourceNode)) {
        if (!$isTextNode(node) || node.hasFormat("code")) return null;
        const text = node.getTextContent();
        const start = text.indexOf("{{");
        if (start < 0) return null;
        return exportFormat(node, text.slice(0, start) + "\uFFFC").replace("\uFFFC", () =>
          text.slice(start),
        );
      }
      const source = $getState(node, sourceState) || node.getTextContent();
      // Apply Lexical's formatting without escaping template syntax.
      return node.hasFormat("code")
        ? exportFormat(node, source)
        : exportFormat(node, "\uFFFC").replace("\uFFFC", () => source);
    },
  },
  ...TRANSFORMERS,
];

function transformers(document: CompiledDocument): Transformer[] {
  return [
    ...document.children.map((part): Transformer => {
      const source = document.content.slice(part.offset, part.end);
      if (part.kind === "element" && !part.inline && part.bodyEnd > part.bodyOffset) {
        return {
          type: "multiline-element",
          dependencies: [TemplateBlockNode],
          regExpStart: new RegExp("^[\\t ]*" + RegExp.escape(part.source)),
          replace: () => false,
          handleImportAfterStartMatch({ lines, startLineIndex, rootNode }) {
            const raw = source.trimEnd();
            const length = raw.split("\n").length;
            const candidate = lines.slice(startLineIndex, startLineIndex + length).join("\n");
            if (candidate.trimStart() !== raw.trimStart()) return null;
            const node = $create(TemplateBlockNode);
            $setState(node, indentState, part.bodyIndent);
            const padding = " ".repeat(part.indent);
            $setState(node, sourceState, padding + part.source);
            $setState(
              node,
              closingState,
              padding + document.content.slice(part.bodyEnd, part.end).trim(),
            );
            $setState(
              node,
              labelState,
              (
                {
                  each: "Repeat",
                  show: "Condition",
                  match: "Match",
                  case: "Case",
                  default: "Otherwise",
                } as Record<string, string>
              )[part.name] ?? part.name,
            );
            const bodyNode = $create(TemplateBodyNode);
            node.append(bodyNode);
            rootNode.append(node);
            const body = document.content.slice(part.bodyOffset, part.bodyEnd);
            const state = new markdown.block.State(body, markdown, {}, []);
            const content = state.getLines(0, state.lineMax, part.bodyIndent, true);
            $convertFromMarkdownString(content, transformers(compile(content)), bodyNode, true);
            return [true, startLineIndex + length - 1];
          },
        };
      }
      return {
        type: "text-match",
        dependencies: [TemplateSourceNode],
        regExp: new RegExp(RegExp.escape(source)),
        importRegExp: new RegExp(RegExp.escape(source)),
        replace(node) {
          if (
            part.kind === "expression" &&
            !node.hasFormat("code") &&
            !$isCodeNode(node.getParent())
          ) {
            node.replace($createTemplateExpression(source).setFormat(node.getFormat()));
            return;
          }
          const replacement = $create(TemplateSourceNode);
          node.replace(replacement.setTextContent(source).setFormat(node.getFormat()));
        },
      };
    }),
    ...templateExport,
  ];
}

/** Imports an MDT document inside a Lexical update. */
export function $importDocument(document: CompiledDocument) {
  $setState($getRoot(), frontmatterState, document.source.slice(0, document.contentOffset));
  $convertFromMarkdownString(document.content, transformers(document), undefined, true);
}

/** Exports the authored template; it never evaluates input values. */
export function $exportDocument() {
  return (
    $getState($getRoot(), frontmatterState) +
    $convertToMarkdownString(templateExport, undefined, true)
  );
}
