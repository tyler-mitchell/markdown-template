import { createState, ElementNode, TextNode, type EditorConfig } from "lexical";
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
