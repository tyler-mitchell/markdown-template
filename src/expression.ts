import { getText, type CstChild } from "monogram/src/gen-parser.ts";

export type Scope = Record<string, unknown>;

/** Uses JavaScript semantics for expressions accepted by the Monogram grammar. */
export function evaluate({
  node,
  source,
  scope,
}: {
  node: CstChild;
  source: string;
  scope: Scope;
}): unknown {
  if ("rule" in node && node.rule === "AttributeValue") {
    return evaluate({ node: node.children[0], source, scope });
  }
  if ("rule" in node && node.rule === "Interpolation") {
    return evaluate({ node: node.children[1], source, scope });
  }
  const expression = getText(node, source);
  function identifiers(child: CstChild): string[] {
    if ("rule" in child) return child.children.flatMap(identifiers);
    return child.tokenType === "Ident" ? [getText(child, source)] : [];
  }
  const bindings = [...new Set(identifiers(node))].filter((name) => Object.hasOwn(scope, name));
  return new Function(...bindings, `"use strict"; return (${expression});`)(
    ...bindings.map((name) => scope[name]),
  );
}
