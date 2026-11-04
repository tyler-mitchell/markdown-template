import {
  $create,
  $createParagraphNode,
  $createTextNode,
  $getState,
  $setState,
  createState,
  ElementNode,
  TextNode,
  type EditorConfig,
} from "lexical";
import { DecoratorTextNode } from "@lexical/extension";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
export const sourceState = createState("source", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const markdownState = createState("markdown", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const closingState = createState("closing", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const labelState = createState("label", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const indentState = createState("indent", {
  parse: (value) => (typeof value === "number" ? value : 0),
});
export const frontmatterState = createState("frontmatter", {
  parse: (value) => (typeof value === "string" ? value : ""),
});

/** An inline template reference retaining its authored expression. */
export class TemplateSourceNode extends TextNode {
  $config() {
    return this.config("mdt-source", { extends: TextNode });
  }

  createDOM(config: EditorConfig) {
    const element = super.createDOM(config);
    element.classList.add("mdt-template-source");
    element.title = $getState(this, sourceState) || this.getTextContent();
    return element;
  }
}

/** Creates a selectable badge whose Markdown export retains the expression. */
export function $createTemplateExpression(source: string) {
  return $setState(
    $create(TemplateSourceNode).setTextContent(source.slice(2, -2).trim()).setMode("token"),
    sourceState,
    source,
  );
}

/** Placeholder for a host-rendered inline reference picker. */
export class TemplateInputNode extends DecoratorTextNode {
  $config() {
    return this.config("mdt-input", { extends: DecoratorTextNode });
  }

  updateDOM() {
    return false;
  }

  decorate(): unknown {
    return null;
  }
}

/** Opens a reference picker without changing the exported expression. */
export function $editTemplateExpression(node: TemplateSourceNode) {
  const source = $getState(node, sourceState);
  const paragraph = $createParagraphNode().append(
    $createTextNode("\uFFFC").setFormat(node.getFormat()),
  );
  const markdown = $convertToMarkdownString(
    TRANSFORMERS,
    $create(TemplateBodyNode).append(paragraph),
    true,
  ).replace("\uFFFC", () => source);
  const input = $setState(
    $setState($create(TemplateInputNode).setFormat(node.getFormat()), markdownState, markdown),
    sourceState,
    source,
  );
  node.replace(input);
  input.selectNext();
  return input;
}

/** Restores an existing expression or removes a new, unfinished field. */
export function $cancelTemplateInput(input: TemplateInputNode) {
  const source = $getState(input, sourceState);
  if (source) {
    return input.replace($createTemplateExpression(source).setFormat(input.getFormat()));
  }
  input.remove();
}

/** A template directive containing editable Markdown. */
export class TemplateBlockNode extends ElementNode {
  $config() {
    return this.config("mdt-block", { extends: ElementNode });
  }

  createDOM() {
    const element = document.createElement("section");
    element.className = "mdt-template-block";
    element.dataset.label = $getState(this, labelState);
    element.title = $getState(this, sourceState);
    return element;
  }

  updateDOM() {
    return false;
  }
}

/** Markdown content between a directive's editable opening and closing lines. */
export class TemplateBodyNode extends ElementNode {
  $config() {
    return this.config("mdt-body", { extends: ElementNode });
  }

  createDOM() {
    return document.createElement("div");
  }

  updateDOM() {
    return false;
  }
}
