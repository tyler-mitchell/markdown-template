# monogram-jora

Reference study of a concrete Monogram-based package.

- Repository: <https://github.com/antfu/monogram-jora>
- Revision: `87af98321b458c7097140bd87717b0fe1bcdbd35`
- Local source: `/Users/tylermitchell/Projects/_external/monogram-jora`

## Questions

1. How are authored grammars, generated files, and package entry points organized?
2. What API does a consumer use?
3. Where does generation happen, and what runs in the consumer?
4. How does the project verify its grammar and generated output?

Study the repository on its own terms. Record source facts separately from
interpretation. Each inspection should answer one question and be reconciled
here before the next source slice.

## Coverage

| Area                   | Status                                       |
| ---------------------- | -------------------------------------------- |
| Package layout         | Root surveyed; file ownership not yet traced |
| Public API             | Observed in `src/index.ts`                   |
| Generation and runtime | Manifest and build boundary observed         |
| Verification           | Pending                                      |

## Root layout — observed

```text
grammar/             9 files
monogram/            Git submodule
src/                 1 file
test/                10 files
package.json
tsdown.config.ts
vitest.config.ts
```

Grammar material, the framework checkout, package source, and tests occupy
separate locations. Their runtime and generation relationships are not yet
established.

## Next inspection

Read the consumer-facing artifact test and determine which boundary it verifies.

## Grammar scope — observed

`grammar/jora.ts:3–13` states that the grammar follows Jora's own tokenizer and
recursive-descent parser. It deliberately over-accepts some constructs for
highlighting, including calls on arbitrary expressions and whitespace before
a method-call parenthesis.

The stated validation criterion is that real queries in
`test/grammar-corpus.test.ts` parse. This does not establish strict rejection
parity with Jora. The grammar's authorship or derivation beyond those comments
has not been verified.

## Lexical choices — observed

`grammar/jora.ts:53–85` explains the declarations beside their implementation:

```ts
const LineComment = token(seq("//", star(noneOf("\n", "\r", "\u2028", "\u2029"))), {
  skip: true,
  scope: "comment.line.double-slash.jora",
});
```

Comments precede regex tokens to win overlapping matches. Block comments allow
an omitted terminator because the referenced Jora tokenizer accepts EOF there.
Number patterns include separators, hex, fractions, and exponents. Both quote
styles permit multiline strings.

These are language-specific decisions documented against Jora behavior, not
general defaults that every Monogram grammar should inherit.

## Package boundary — observed

`package.json:29–54`:

```json
{
  "exports": {
    ".": "./dist/index.mjs",
    "./package.json": "./package.json",
    "./grammar/jora.tmLanguage.json": "./grammar/jora.tmLanguage.json",
    "./grammar/jora.monarch.json": "./grammar/jora.monarch.json",
    "./grammar/jora.language-configuration.json": "./grammar/jora.language-configuration.json"
  },
  "types": "./dist/index.d.mts",
  "files": ["dist", "grammar/*.json"]
}
```

Generation and verification use:

```text
regen → node monogram/src/cli.ts grammar/jora.ts
build → regen, then tsdown
test  → build, then vitest
```

The published files exclude the Monogram checkout and authored grammar source.
The manifest has no runtime dependencies. Its stated purpose is generated
language tooling.

## Consumer API — observed

`src/index.ts:9–41` imports generated JSON and exports:

```ts
import { tmLanguage, languageConfiguration, monarch } from "monogram-jora";
```

The default export is `tmLanguage`. The source comment explicitly states that
the generated artifacts are committed and the package consumer does not pull
in Monogram.

This public entry is an artifact package. It does not export a runtime parser
or evaluator. Its minimal facade and generation boundary are separate from the
question of how a parser-based package should expose execution.

## Build boundary — observed

`tsdown.config.ts` bundles the one public entry, emits declarations, and retains
explicit exports for the raw generated JSON:

```ts
entry: ['src/index.ts'],
dts: true,
publint: true,
plugins: [StaleGuardRecorder()],
```

The comment on `customExports` distinguishes two consumer paths: importing
artifact values from the module and resolving actual JSON files from disk.
Both are deliberate public contracts. No parser generation is added by this
build configuration.
