# MDT document-language research

Historical project-specific integration research. Candidate files and test
paths below record the investigation and may no longer describe the active
implementation. Current behavior is defined by `src/` and exercised by
`test/fixtures/`.
Framework facts belong in [Monogram](monogram.md); durable needs belong in
[requirements](../requirements.md). [Markdoc](markdoc.md) is a comparison reference.

## Objective

Shape the document system before choosing its implementation. Demonstrate the
selected grammar against real authored documents and upstream usage.
The existing implementation is a candidate, not the reference architecture.

Study one concept at a time and record material findings before continuing.
Do not select evidence merely to justify an existing candidate implementation.
Agent-skill synthesis comes later.

## Shaping boundaries

### Fixed requirements

- Files own content, metadata, schemas, and declarative document behavior.
- YAML schema data passes unchanged to ArkType; `input` selects an authored export.
- Application fields and defaults belong in documents, not the engine.
- Ordinary authoring needs no companion TypeScript files or callbacks.
- Documents support values, conditions, type patterns, repetition, and fragments.
- Resolution remains independent of the renderer and application side effects.
- Source remains authoritative during inline editing, including incomplete input.
- Public use does not require consumers to build or traverse parser trees.

### Preferences to evaluate

- ArkType-style matching is preferred; when clauses are the alternative.
- Familiar HTML-like constructs are preferred over Markdoc's delimiters.
- A reserved prefix was suggested to distinguish constructs from literal content.
- Existing canonical libraries should own the responsibilities they already solve.

### Introduced assumptions to challenge

- Monogram must be a runtime dependency because it was the research target.
- JavaScript expressions are the right document expression language.
- The whole MDX syntax bundle is an appropriate Markdown baseline.
- Runtime React components provide document control flow without further machinery.
- One parser instance per expression establishes a complete editing architecture.
- An accepted AST and successful parse establish usable document semantics.

### End-to-end scenarios

| Scenario                     | Required outcome                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Reference-sheet instructions | Load typed references and optional guide settings; apply authored defaults; preserve references as distinct inputs |
| Conditional content          | Include the correct sections using data and type patterns; define branch order and missing-value behavior          |
| Repeated content             | Resolve nested sections under item scope without losing access to document arguments                               |
| Shared content               | Resolve relative fragments with explicit inputs and useful error locations                                         |
| Literal examples             | Preserve fenced and inline code, Markdown links, and content resembling language delimiters                        |
| Inline editing               | Connect preview elements to source; preserve untouched text and metadata; retain invalid edits with diagnostics    |
| Host components              | Use explicit component contracts without embedding application behavior in the document engine                     |

### Approaches to compare

| Approach                                    | Responsibility boundary to investigate                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Existing declarative document engine        | Reuse its parser and resolver; integrate ArkType and the public loading API                           |
| Existing text template engine plus Markdown | Resolve templates into text, then parse/render Markdown; investigate source correspondence            |
| Markdown parser plus Monogram               | Reuse Markdown recognition; define and own only the embedded language and its semantics               |
| Markdown/MDX syntax without its compiler    | Reuse document and expression parsing; determine the required resolution layer                        |
| Full MDX compiler/runtime                   | Reuse compilation and execution; assess callback authoring, renderer coupling, and declarative scopes |

These approaches are unselected. Evaluate the same scenarios for each.
Dependencies already installed carry no presumption of suitability.

### Bounded shaping result

Recommendation for review: a bounded declarative document language built on an
existing Markdown parser. ArkType owns schemas and type-pattern semantics.
Its expression language should cover the document's operations explicitly.
General JavaScript authoring is not part of this recommendation.

| Approach                                   | Fit                                                                                                                     | Main cost                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Existing document engine                   | Closest structural model; Markdoc separates parse, validate, transform, and render; MDX supplies syntax and compilation | Adopting either engine also adopts contracts that differ from the requested authoring and Markdown behavior             |
| Text-template engine followed by Markdown  | Direct fit for producing prompt text                                                                                    | Structured preview and editing need an additional relationship between generated Markdown and authored template regions |
| Markdown with a declarative document layer | Keeps Markdown, typed arguments, document semantics, and host rendering separately owned                                | The document layer must implement and verify branch selection, scope, repetition, fragments, and source correspondence  |

Proposed division:

- Frontmatter parsing produces data. ArkType receives the schema unchanged.
- Markdown parsing preserves authored structure and source locations.
- A bounded expression grammar handles literal, reference, and boolean syntax.
- Document constructs select ArkType patterns and establish branch/item scopes.
- Resolution produces structured content shared by previews and output renderers.
- Host applications own components, artifacts, data access, and side effects.
- Editors change source or supplied arguments explicitly; repeated previews retain
  their relationship to the one authored template region.

This recommendation does not adopt full MDX execution or its Markdown changes.
The current MDX bundles disable indented code, autolinks, and raw HTML.
Their unmodified composition fails the Markdown-preservation requirement.

The current Monogram grammar recognizes a subset of ordinary expression syntax.
That overlap does not disqualify it: a bounded grammar can directly define the
accepted document language instead of accepting a larger language and rejecting
its unwanted constructs afterward.

The Markdoc FAQ substantiates this architectural purpose through declarative
authoring, predictable flow control, and simpler static analysis and transforms.
Monogram is the existing researched candidate for that grammar responsibility.
It does not own Markdown, ArkType semantics, document resolution, or rendering.

The current agnostic-MDX/Monogram composition has not established the desired
boundary. Its brace handling and Markdown behavior need to meet the authored
language contract. Neither keeping that composition nor replacing it with full
MDX follows automatically from the recommendation.

The selection is reserved for discussion with the user. Stop expanding the
comparison; preserve the Monogram research and current implementation.

## Authoring direction

The file is the authoring surface. Frontmatter `schema` must pass unchanged to
ArkType's `type.module`; `input` names the export that describes arguments.
The core must not prescribe fields such as subject, finish, or view names.

Prefer established syntax familiar to agents. HTML-like tags with expression
attributes are under consideration:

```mdx
<$show if={references.length > 0}>
Use the supplied references to preserve character identity.

<ReferenceList items={references} />
</$show>
```

Status: proposed syntax, not implemented. The user suggested `show` or `$show`;
the prefix could distinguish language constructs from host components.
Expression semantics and the full authoring contract remain unsettled.
Markdoc's `{% %}` delimiters are not an accepted requirement.

## Ownership to preserve

### Parser selection

The current Monogram grammar recognizes a subset of JavaScript expressions.
Assess that grammar against the proposed declarative contract, including the
behavior of rejected constructs, rather than syntax novelty.
`micromark-extension-mdxjs/lib/index.js:23–38` supplies Acorn, JSX support, and
`addResult: true`; its native expression trees include parsed JavaScript.

The user's ArkType matching preference concerns type-pattern semantics.
It does not by itself require a new lexical or grammatical construct.
Whether matching uses existing tags/attributes or a new operator is an authoring
decision, not a consequence of choosing a parser.

The [Devframe when-clause reference](https://devfra.me/references/when-clauses)
(read 2026-10-08) identifies `whenexpr` as its existing evaluator. It documents
string-style `==`, strict `===`, and flat namespaced context keys. Recreating
those rules in Monogram would need a concrete advantage over that package.

Monogram research is retained independently of the product's parser choice.
No parser replacement has been applied. Shaping is closed for user review.

`micromark-extension-mdx-md@2.0.0/readme.md:29–44` explicitly disables
indented code, autolinks, and raw HTML. Both the existing agnostic composition
and the JavaScript-aware composition include this extension. Neither can be
called fully CommonMark-compatible. This conflicts with the broad Markdown
preservation requirement and must be resolved at the composition boundary.

`micromark-util-combine-extensions@2.0.1/index.js:82–92` places constructs
marked `add: 'after'` after existing constructs. This is the native precedence
mechanism to investigate for retaining Markdown's HTML and autolinks.
Omitting `mdxMd` retains the constructs themselves; precedence still needs
runtime verification. No custom tokenizer is justified by this finding.

```text
authored file
  → standard frontmatter parser → unchanged schema data → ArkType
  → Markdown syntax and embedded expression regions
    → Monogram expression parsing
    → application-owned resolution and rendering
```

Status: candidate composition. No complete document pipeline exists yet.

The editor should retain source and map preview elements to source ranges.
It must preserve unrelated formatting and unknown content. Parser nodes remain
an implementation concern; authors must not construct them.

## Markdown integration candidates

| Candidate                                                    | Evidence and constraint                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Monogram markup mode over the entire body                    | Preserves text between tags, but its configuration does not recognize Markdown fences or code spans |
| A custom Markdown lexer                                      | Duplicates established capabilities; no justification                                               |
| An existing Markdown extension plus Monogram for expressions | Promising; expression boundaries and source mapping need proof                                      |

An isolated directive parser does not establish a document architecture.
Do not infer Markdown behavior from HTML lexer tests.

## JavaScript-agnostic MDX candidate

### Sources

| Repository                          | Revision                                   | Local checkout                                                    |
| ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `micromark/micromark-extension-mdx` | `43fcd02fd013d1332f01654f97775c6f2a094009` | `/Users/tylermitchell/Projects/_external/micromark-extension-mdx` |
| `syntax-tree/mdast-util-mdx`        | `9a8c096cf9cf48ec5be34514c7ceabfcbf0ddfff` | `/Users/tylermitchell/Projects/_external/mdast-util-mdx`          |

The official
[micromark extension](https://github.com/micromark/micromark-extension-mdx)
supports JSX and expression bodies without imposing JavaScript syntax.
Its README also notes that it disables some Markdown features. That effect
must be evaluated rather than silently inherited.

### Syntax-tree composition

`micromark-extension-mdx/readme.md:89–106`:

```js
import { micromark } from "micromark";
import { mdx } from "micromark-extension-mdx";

const output = micromark("a <b /> c {1 + 1} d", { extensions: [mdx()] });
```

The HTML result drops the custom constructs. Upstream directs tree consumers
to `mdast-util-from-markdown` and `mdast-util-mdx`.

`mdast-util-mdx/readme.md:109–123` demonstrates:

```js
const tree = fromMarkdown(doc, {
  extensions: [mdxjs()],
  mdastExtensions: [mdxFromMarkdown()],
});
```

That example uses the JavaScript-aware extension. The agnostic extension's own
README recommends the same tree utility.

`mdast-util-mdx/lib/index.js:25–31`:

```js
export function mdxFromMarkdown() {
  return [mdxExpressionFromMarkdown(), mdxJsxFromMarkdown(), mdxjsEsmFromMarkdown()];
}
```

The adapter composes handlers; it does not invoke a JavaScript parser.
ESTree data is optional and supplied by syntax extensions using `addResult`.

`mdast-util-frontmatter@2.0.1/readme.md:104–124` composes
`frontmatter(['yaml'])` with `frontmatterFromMarkdown(['yaml'])` in the same
`fromMarkdown` call. It returns a `yaml` node containing raw frontmatter text.
YAML decoding and ArkType module construction remain separate responsibilities.

`vfile` is not needed for this composition; the direct dependency was removed.

The expression extension's `readme.md:183–237` defines the boundary: agnostic
mode counts balanced braces without parsing JavaScript. Inline expressions
cannot cross a blank line; block expressions can. Unbalanced host syntax throws
a located error. Braces inside strings/comments are not interpreted with
JavaScript semantics in agnostic mode.

`test/document.test.ts` exercises complete `.mdt` files through this composition.
Nested `$show` tags, expression attributes, inline code, and fenced code parse.
Standalone expressions carry source positions. Attribute expression values do
not carry them, despite the optional field in their type.

`mdast-util-mdx-jsx/lib/index.js:362–377` assigns the expression value to its
parent attribute and extends that attribute's position through the closing
brace. The parser therefore retains the whole attribute as the source anchor.
Expression diagnostics remain relative to the expression value; they must not
be presented as absolute document offsets.

## Native Monogram parser choice

The reference interpreter and generated parser have different contracts.
See [the framework reference](monogram.md#generated-parsers).

For interactive editing, the generated JavaScript target supplies diagnostics
and an editable handle. One parser instance owns one current document;
reopening invalidates the previous handle. This does not decide whether the
host's parsing unit should be a full document or an embedded expression.

Generated lexer-mode fallbacks can contain absolute imports into the Monogram
checkout. Distribution must follow the selected backend's actual output.
Do not add an import-rewriting workaround without establishing the proper path.

## Implementation evidence

```text
grammar/expression.ts     Monogram expression grammar
scripts/generate.ts       Native parser emission through cmd-mesh
src/generated/            Emitted parser, unchanged by hand
src/parse.ts              Agnostic MDX plus embedded Monogram parsing
examples/*.mdt            Reference-sheet and general-document fixtures
examples/grammar.ts       File-based parser demonstration
test/expression.test.ts   Native parser agreement and edit behavior
test/document.test.ts     Document parsing and direct ArkType module use
test/mdx.test.ts          Official JavaScript-aware MDX composition comparison
```

The file-based command parsed the reference-sheet file, preserving its schema
and reporting expression regions. Native Monogram edit checks compared edited
handles with fresh parses. The copied ArkType patch supplied metadata defaults
through `type.module(frontmatter.schema)` without schema rewriting.

The MDX comparison parsed both real files, retained absolute expression positions
inside attributes, and handled braces inside strings. It also demonstrated the
indented-code incompatibility with CommonMark.

These observations do not establish condition evaluation, repeated-section
resolution, fragment loading, component rendering, or an interactive editor.
Those execution paths are absent.

The latest document test used an inappropriate JSON Schema conversion to inspect
URL metadata. The assertion now uses ArkType's native `as().get()` API; that edit
has not been rerun. No complete verification claim is made.

## Completion evidence still required

- A source-backed architecture and an explicit authoring contract.
- Real document fixtures, including nested constructs and literal Markdown.
- A runnable grammar demonstration through the chosen public parser path.
- Source preservation and diagnostics at the correct document locations.
- Tests covering actual authoring and editing behavior in that architecture.

An isolated expression example, generated artifact, or successful command is
insufficient evidence for the complete document path.
