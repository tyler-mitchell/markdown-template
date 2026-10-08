# Monogram

Source-based reference to Monogram's model, authoring API, parser contracts, and
generated artifacts.

- Repository: <https://github.com/johnsoncodehk/monogram>
- Inspected revision: `8c489e29e000fbfd886fb89ecf2cfcc94bde38b6`
- Source paths below belong to that revision.
- “Observed” means inspected in source. Runtime observations are listed separately.

## Author a grammar

Adapted from `test/agnostic.ts:11–39`, with imports relative to the repository root:

```ts
import { token, rule, defineGrammar, alt, many, plus, range } from "./src/api.ts";
import { createParser } from "./src/gen-parser.ts";

const Word = token(plus(range("a", "z")), { identifier: true });
const Num = token(plus(range("0", "9")));
const Program = rule(() => [many(alt(Word, Num, "+"))]);

const grammar = defineGrammar({
  name: "mini",
  tokens: { Word, Num },
  rules: { Program },
  entry: Program,
});

const { tokenize, parse } = createParser(grammar);
const tree = parse("foo + 12 + bar");
```

The grammar describes syntax; it does not evaluate the parsed language.

## Grammar model

`CstGrammar`, `src/types.ts:558–611`, is the assembled representation consumed by
the framework. `defineGrammar` constructs it from authoring objects.

| Fields                                                | Responsibility                          |
| ----------------------------------------------------- | --------------------------------------- |
| `tokens`, `rules`                                     | Lexical and syntactic definitions       |
| `precs`, `ledPrecs`                                   | Operator binding and associativity      |
| `markup`, `indent`, `newline`                         | Optional lexer modes                    |
| `scopeOverrides`, `contextualScopes`, `scopeName`     | Highlighting labels                     |
| `expressionRule`, `aliasScopes`, `canonicalRepoNames` | Generated highlighting composition      |
| `manifest`                                            | Generated VS Code contribution metadata |

Highlighting composition fields are not runtime parser composition APIs.

### Token patterns

`src/types.ts:1–13`:

```ts
type TokenPattern =
  | string
  | { type: "anyChar" }
  | { type: "charClass"; negate: boolean; items: TokenCharClassItem[] }
  | { type: "seq"; items: TokenPattern[] }
  | { type: "alt"; items: TokenPattern[] }
  | { type: "repeat"; body: TokenPattern; min: number; max?: number; greedy: boolean }
  | { type: "lookahead"; body: TokenPattern; negate: boolean }
  | { type: "lookbehind"; body: TokenPattern; negate: boolean }
  | { type: "anchor"; kind: "start" | "end" }
  | { type: "never" };
```

Strings are literal characters. Combinators such as `seq`, `oneOf`, `range`,
`noneOf`, `star`, and `plus` build this representation. A `RegExp` is not a valid
argument to `token` (`README.md:284–293`).

`tokenPatternToRegex(pattern)` returns regex source text, not a compiled regex
or parser (`src/token-pattern.ts:81–83`). One observed use creates TextMate
`match` patterns (`src/gen-tm.ts:5062–5065`).

### Token behavior and metadata

`TokenDecl`, `src/types.ts:19–68`:

| Fields                                                   | Effect                                              |
| -------------------------------------------------------- | --------------------------------------------------- |
| `identifier`, `identifierPrefix`                         | Native Unicode identifier handling                  |
| `template`                                               | Runtime tokenization of interpolation holes         |
| `regexContext`                                           | Context-sensitive regex versus division recognition |
| `escapeValidPattern`                                     | Escape checking for engine-scanned tokens           |
| `blockPattern`, `blockOnly`                              | Indentation-mode lexical behavior                   |
| `scope`, `escapePattern`, `interpolation`, `lineComment` | Highlighting metadata                               |
| `string`                                                 | String delimiters used for editor configuration     |

`template` and `interpolation` are distinct: only the former declares runtime
interpolation-hole tokenization. Neither defines evaluation.

### Syntax rules

`RuleExpr`, `src/types.ts:474–544`:

| Forms                             | Role                                    |
| --------------------------------- | --------------------------------------- |
| `literal`, `ref`                  | Match a literal or named token/rule     |
| `seq`, `alt`                      | Compose syntax                          |
| `quantifier`, `sep`               | Optional, repeated, or separated syntax |
| `group`                           | Apply context without adding a node     |
| `not`, `sameLine`, related guards | Non-consuming constraints               |
| `op`, `prefix`, `postfix`         | Operator slots                          |

A token pattern recognizes characters. A syntax rule operates over tokens and
other rules. Similar combinator names do not imply identical semantics.

Some constraints are target-specific. `sameLine` is enforced by the parser but
treated as a no-op by other generators. `tsRelaxed` supplies an alternative
tree-sitter production. Highlighting does not prove parser acceptance.

## References and entry points

`src/api.ts:399–431,539–603` resolves references through the supplied token and
rule objects:

```ts
defineGrammar({
  name: "mini",
  tokens: { Word, Num },
  rules: { Program },
  entry: Program,
});
```

Unregistered references fail during construction. Rule callbacks retain their
referenced objects; replacing a name in an assembled grammar does not rebind
those references (`javascript.ts:12–15`).

At this revision, `GrammarConfig.entry` is required but the assembled return
value omits it (`src/api.ts:523,630`). The effective default is:

```ts
export function findEntryRule(grammar: CstGrammar): string {
  return grammar.rules[grammar.rules.length - 1].name;
}
```

Source: `src/grammar-analysis.ts:39–42`. Upstream fixtures put the entry last
(`test/fixtures/calc.ts:55`). The reference parser also accepts an explicit
entry name: `parse(source, entryRule?)`.

## Lexer behavior

The ordinary lexer skips whitespace before token matching
(`src/gen-lexer.ts:838–863`). Named token patterns are tried in declaration order;
punctuation literals are tried longest first (`src/gen-lexer.ts:54–108`).

The lexer derives identifier behavior from the declaration marked `identifier`.
Its Unicode fallback is exercised in `test/agnostic.ts:24–30`.

Bare identifier fallback precedes prefixed identifier fallback
(`src/gen-lexer.ts:1290–1317`). Prefixes that are themselves identifier-start
characters can overlap the bare fallback. `$` is classified as an
identifier-start character (`src/grammar-utils.ts:11–36`).

### Markup mode

`test/html-lexer-spike.ts:34–47`:

```ts
markup: {
  textToken: 'Text',
  tagOpen: '<',
  tagClose: '>',
  closeMarker: '/',
  rawText: { tags: ['script', 'style', 'textarea', 'title'], token: 'RawText' },
  comment: { open: '<!--', close: '-->', token: 'Comment' },
}
```

The state machine emits text, raw-text, and comment tokens; their ordinary
patterns are placeholders. Tests assert significant spaces, Unicode, nested
elements, and raw content containing tag punctuation.

The inspected configuration has one tag-opener/closer pair
(`src/types.ts:149–246`). The text loop stops at that opener
(`src/gen-lexer.ts:634–661`). It does not implement Markdown code-span or fence
recognition. `markup.inject` describes generated highlighting injection.

## Rule selection and recursion

| Construct                  | Observed behavior                                                   | Source                        |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| Ordinary rule alternatives | Longest successful match; earlier arm wins ties                     | `src/gen-parser.ts:536–567`   |
| Inline `alt(...)`          | First successful arm                                                | `src/gen-parser.ts:881–889`   |
| Sequence                   | Restores its start on failure; no redistribution of earlier matches | `src/gen-parser.ts:945–956`   |
| Quantifier                 | Greedy; does not yield consumed input to later items                | `src/gen-parser.ts:1094–1122` |
| `sep`                      | Allows an empty list and a trailing delimiter                       | `src/gen-parser.ts:1124–1139` |

The inline choice loop:

```ts
for (const item of expr.items) {
  pos = saved;
  const result = matchExpr(item);
  if (result !== null) return result;
}
```

A later failure in the containing sequence does not retry another successful
inline arm.

`test/left-recursion.ts:24–49` establishes direct recursion:

```ts
const A = rule(($) => [[$, W], W]);
```

Indirect `A → B → A` and recursion hidden behind a nullable prefix are rejected
at parser construction with a cycle diagnostic.

## Expression examples

`test/fixtures/minijs.ts:44–55`:

```ts
const Expr = rule(($) => [
  Number_,
  Str,
  Ident,
  ["(", $, ")"],
  ["[", opt(sep($, ",")), "]"],
  [prefix, $],
  [$, op, $],
  [$, "(", opt(sep($, ",")), ")"],
  [$, ".", Ident],
  [$, "[", $, "]"],
]);
```

Operator precedence is declared separately. `test/fixtures/calc.ts:29–33`
orders looser levels before tighter levels:

```ts
const calcPrec = [left("+", "-"), left("*", "/"), right(prefix("-"))];
```

Object syntax is isolated in `test/fixtures/altjs.ts:20–27`:

```ts
const KeyVal = rule(($) => [[alt(Ident, Str, Number_), ":", Expr]]);
const Expr = rule(($) => [
  Number_,
  Str,
  Ident,
  ["(", $, ")"],
  ["{", opt(sep(KeyVal, ",")), "}"],
  [$, op, $],
]);
```

Further examples: escaped strings in `test/fixtures/minijs.ts:27`; decimal
fractions/exponents in `javascript.ts:90–98`; recursive markup content in
`html.ts:74–87`.

## Reference parser and source ranges

`README.md:31–36`:

```ts
import { createParser } from "./src/gen-parser.ts";
import grammar from "./typescript.ts";

const { parse } = createParser(grammar);
const tree = parse("const x = f(a, b)");
```

`src/gen-parser.ts:9–30`:

```ts
interface CstNode {
  rule: string;
  children: CstChild[];
  offset: number;
  end: number;
}
interface CstLeaf {
  tokenType: string;
  offset: number;
  end: number;
}
type CstChild = CstNode | CstLeaf;
```

`getText(node, source)` calls `source.slice(node.offset, node.end)`.
`test/cst-text-invariant.ts:22–39` checks span bounds and distinct branch/leaf
shapes.

The reference parser's contracts (`src/gen-parser.ts:355–356,1141–1189`):

- `parse` tokenizes the supplied source and requires all tokens consumed.
- Failure throws a diagnostic containing an offset, sometimes a farther position.
- Empty token streams return an empty entry node without testing the entry rule.
- `parseTotal` catches input failures but returns a zero-width error root and
  structured offsets of zero.
- Its internal `parseLimit` is not a public bounded-region parser option.

## Generated parsers

The public emitter surface is `src/emit.ts`:

```ts
import { emitParser, emitLexer, jsTarget, tsTarget } from "./src/emit.ts";

const javascriptParser = emitParser(grammar, jsTarget);
const typescriptParser = emitParser(grammar, tsTarget);
const typescriptLexer = emitLexer(grammar, tsTarget);
```

The returned values are source text. Consumers write and load that source.

| Target                       | Consumption contract                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `tsTarget`, portable targets | `tokenize(source)`, then `parse(tokens)`                           |
| `jsTarget`                   | Fused lexer/parser; strict arena API and editable document handles |

Source: `README.md:343–362`. Examples are not interchangeable across targets.

The CLI in `src/cli.ts` generates highlighting, language configuration, and CST
matchers. It does not call `emitParser`.

### Generated runtime dependencies

`src/emit-parser.ts:1101–1116`:

```ts
export const jsTarget: Target = {
  name: "javascript",
  ext: "js",
  embedLexer: emitJsLexer,
  emitLexer: () => null,
  emitParser: emitJsParser,
};
```

There is no standalone lexer output for this target. `emitJsLexer` delegates to
`emitSoaLexer`; these configurations return `null`
(`src/emit-lexer.ts:48–51`):

```ts
if (grammar.markup || grammar.indent || grammar.newline) return null;
if (grammar.tokens.some((t) => tokenBlockPatternSource(t) || t.blockOnly)) return null;
```

The parser then imports the runtime lexer through an absolute source-checkout
path (`src/emit-parser.ts:1157,1335`). Such output is not standalone. Ordinary
token-stream grammars can receive the generated lexer.

### Editable documents

`test/recovery.ts:19–34` writes emitted source to an `.mts` file, imports it, and
creates instances. `test/multi-doc.ts:56–60` establishes ownership:

```ts
const p1 = em.createParser();
const p2 = em.createParser();
const cstA = p1.parse(textA);
const cstB = p2.parse(textB);
```

One instance owns one current document. Reopening with `parse` invalidates its
earlier handle. `edit` updates the current handle in place:

```ts
p.edit(c, [{ start: pos, end: pos, text: ch }]);
const fresh = q.parse(text);
```

Source: `test/recovery.ts:111–115`. Structure is read through `visit` and `tree`
accessors. Full object materialization in `test/emitted-obj.ts` is test-only.

`docs/TOTAL-PARSING.md:11–20` specifies:

- Input errors return a tree and `errors`; API misuse can throw.
- Valid trees agree with strict parsing.
- An edited tree and its errors agree with a fresh parse of the same source.

Foreign handles and invalid edit coordinates are misuse
(`test/multi-doc.ts:90–113`). The interpreter's `createParser(grammar)` and the
generated module's `createParser()` are different APIs.

## Typed semantic output

`docs/SHAPE.md:17–33`:

```ts
type ShapeSpec = {
  grammar: string;
  spans: "required" | "optional" | "none";
  unmapped: "default" | "error";
  leaves: Record<string, TokenLeafPolicy>;
  rules: Record<string, RuleShape>;
};
```

`emitTs(grammar, { shape })` adds typed AST construction and `parseAst` to the
TypeScript output. Mappings cover token coercion, nodes, lists, alternatives,
and spans. This differs from the JavaScript target's editable-handle API.

## Runtime observations

These upstream scripts were executed unchanged at the recorded revision:

| Command                       | Observed behavior                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `node test/agnostic.ts`       | Declared identifier names work with Unicode; undeclared template syntax is rejected                                    |
| `node test/left-recursion.ts` | Direct recursion parses; indirect and nullable-hidden cycles are diagnosed                                             |
| `node test/recovery.ts`       | Invalid input returns deterministic diagnostics; typing agrees with fresh parsing; missing-token structure is retained |
| `node test/multi-doc.ts`      | Separate instances retain independent state through interleaved edits; handle lifecycle is enforced                    |

These observations cover the scripts' inputs, not every supported grammar or
every claim in upstream benchmark tables.

## Further source coverage

| Area                        | Current evidence                                         | Useful next source                                  |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Authoring and basic parsing | Declarations, examples, selected runtime checks          | Further concrete grammar fixtures                   |
| Operator parsing            | Precedence examples and selected implementation          | `test/fixtures/ledjs.ts`                            |
| Templates                   | Declaration contract; runtime semantics not fully traced | `test/fixtures/templatejs.ts`                       |
| Indentation/newline modes   | Configuration and emission boundary inspected            | `test/newline-mode.ts`, `test/indent-extensions.ts` |
| Shape mapping               | Public schema and documentation inspected                | `src/shape-calc.ts`, `test/shape-codegen.ts`        |
| Derived highlighting        | Selected metadata and generator paths inspected          | Target-specific conformance tests                   |

Read one concept, reconcile its finding here, then select the next source.
