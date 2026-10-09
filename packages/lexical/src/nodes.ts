import { $getState, createState, ElementNode, TextNode, type EditorConfig } from "lexical";

export const openingState = createState("opening", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const closingState = createState("closing", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
export const indentState = createState("indent", {
  parse: (value) => (typeof value === "number" ? value : 0),
});
export const frontmatterState = createState("frontmatter", {
  parse: (value) => (typeof value === "string" ? value : ""),
});

/** An interpolation retained during Markdown conversion. */
export class TemplateExpressionNode extends TextNode {
  $config() {
    return this.config("mdt-expression", { extends: TextNode });
  }

  createDOM(config: EditorConfig) {
    const element = super.createDOM(config);
    element.classList.add("mdt-template-expression");
    return element;
  }

  getExpression() {
    return this.getTextContent().slice(2, -2).trim();
  }

  setExpression(expression: string) {
    return this.setTextContent(`{{ ${expression} }}`);
  }
}

/** Source retained for literal escapes and inline directives. */
export class TemplateSourceNode extends TextNode {
  $config() {
    return this.config("mdt-source", { extends: TextNode });
  }
}

/** A template directive containing editable Markdown. */
export class TemplateBlockNode extends ElementNode {
  $config() {
    return this.config("mdt-block", { extends: ElementNode });
  }

  createDOM() {
    const element = document.createElement("section");
    element.className = "mdt-template-block";
    element.dataset.directive = $getState(this, openingState);
    return element;
  }

  updateDOM(_previous: TemplateBlockNode, element: HTMLElement) {
    element.dataset.directive = $getState(this, openingState);
    return false;
  }
}
