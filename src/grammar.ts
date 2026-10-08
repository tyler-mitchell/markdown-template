import {
  alt,
  altPattern,
  anyChar,
  defineGrammar,
  left,
  many,
  noneOf,
  oneOf,
  op,
  opt,
  optPattern,
  plus,
  prefix,
  range,
  right,
  rule,
  sep,
  seq,
  star,
  token,
} from "monogram/src/api.ts";
import { createParser } from "monogram/src/gen-parser.ts";

const digit = range("0", "9");
const start = oneOf(range("a", "z"), range("A", "Z"), "_", "$");
const Ident = token(seq(start, star(oneOf(start, digit))), { identifier: true });
const StringLiteral = token(
  seq('"', star(altPattern(noneOf('"', "\\", "\n", "\r"), seq("\\", anyChar()))), '"'),
  { string: true },
);
const NumberLiteral = token(
  seq(
    plus(digit),
    optPattern(seq(".", plus(digit))),
    optPattern(seq(oneOf("e", "E"), optPattern(oneOf("+", "-")), plus(digit))),
  ),
);
const Property = rule(() => [[alt(Ident, StringLiteral), ":", Expression]]);
const Expression = rule(($) => [
  "true",
  "false",
  "null",
  StringLiteral,
  NumberLiteral,
  Ident,
  ["(", $, ")"],
  ["[", sep($, ","), "]"],
  ["{", sep(Property, ","), "}"],
  [prefix, $],
  [$, op, $],
  [$, ".", Ident],
  [$, "[", $, "]"],
]);
const Interpolation = rule(() => [["{", Expression, "}"]]);
const AttributeValue = rule(() => [StringLiteral, Interpolation]);
const Attribute = rule(() => [[Ident, opt("=", AttributeValue)]]);
const Tag = rule(() => [
  ["<$", Ident, many(Attribute), opt("/"), ">"],
  ["</$", Ident, ">"],
]);

export const grammar = defineGrammar({
  name: "mdt",
  tokens: { Ident, StringLiteral, NumberLiteral },
  prec: [
    left("||"),
    left("&&"),
    left("===", "!==", "==", "!="),
    left("<", ">", "<=", ">="),
    right(prefix("!", "-")),
  ],
  rules: { Property, AttributeValue, Attribute, Tag, Interpolation, Expression },
  entry: Expression,
});

export const parser = createParser(grammar);
