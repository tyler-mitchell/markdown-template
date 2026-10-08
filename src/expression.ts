import { getText, type CstChild } from "monogram/src/gen-parser.ts";

export type Scope = Record<string, unknown>;

/** Uses JavaScript semantics for expressions accepted by the Monogram grammar. */
export function evaluate({
  node,
  source,
  scope,
  schema,
}: {
  node: CstChild;
  source: string;
  scope: Scope;
  schema?: unknown;
}): unknown {
  if ("rule" in node && node.rule === "AttributeValue") {
    return evaluate({ node: node.children[0], source, scope, schema });
  }
  if ("rule" in node && node.rule === "Interpolation") {
    return evaluate({ node: node.children[2], source, scope, schema });
  }
  if ("rule" in node && node.rule === "AttributeExpression") {
    return evaluate({ node: node.children[1], source, scope, schema });
  }
  const expression = getText(node, source);
  function identifiers(child: CstChild): string[] {
    if ("rule" in child) return child.children.flatMap(identifiers);
    return child.tokenType === "Ident" ? [getText(child, source)] : [];
  }
  const bindings = [...new Set(identifiers(node))].filter(
    (name) => name === "$schema" || Object.hasOwn(scope, name),
  );
  return new Function(...bindings, `"use strict"; return (${expression});`)(
    ...bindings.map((name) => (name === "$schema" ? schema : scope[name])),
  );
}
