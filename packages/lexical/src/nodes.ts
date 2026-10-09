import {
  $create,
  $getState,
  $setState,
  createState,
  ElementNode,
  TextNode,
  type EditorConfig,
} from "lexical";
import { DecoratorTextNode } from "@lexical/extension";
export const sourceState = createState("source", {
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
