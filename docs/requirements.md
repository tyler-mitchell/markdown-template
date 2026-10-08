# Requirements

## Purpose

The project defines a general-purpose document format based on Markdown.
Documents combine authored content, metadata, static schemas, and declarative expressions.
Prompt templates are one use case.

## Authoring

- The document file must be the primary authoring surface for humans and agents.
- Documents must contain their prose, structure, metadata, and argument definitions.
- Authors must not need TypeScript files or callbacks for normal document authoring.
- Ordinary Markdown must retain its established meaning.
- Application-specific field names, subjects, layouts, and defaults must come from authored documents.
- The format must not prescribe a particular application, model provider, or host.

## Frontmatter and schemas

- An existing, maintained library must parse frontmatter.
- Frontmatter must support metadata for document discovery and use.
- `frontmatter.schema` must contain a static ArkType module definition.
- The parsed value must work directly with `type.module(frontmatter.schema)`.
- The system must not clean, rename, rewrite, or translate schema definitions before it passes them to ArkType.
- Module references, compositions, and type expressions must retain their ArkType meaning.
- Field definitions must support ArkType metadata tuples, including descriptions and defaults.
- Schema loading and introspection must preserve field metadata.
- Declared defaults must supply omitted values and retain consistent input and output types.
- Schema behavior must come from the authored ArkType definition.
- `frontmatter.input` must select a module export by name as the argument schema.
- Authors choose module export names. The format must not require an export named `Input`.
- A document without arguments must not require an argument schema.

## Document language

- The language must support value insertion, repeated sections, and conditional sections.
- Supported conditions must be expressible in the document without application callbacks.
- Type patterns must retain their ArkType meaning.
- Expression syntax must distinguish literal values, value references, and type patterns.
- Evaluation order, variable scope, and branch selection must have defined behavior.
- Nested sections must preserve their scope and authored order.
- The language must support reusable document fragments.
- Authored prose must not require conversion into a collection of substitution fields.

## Discovery and use

- Consumers must discover and load documents from supplied file or directory locations.
- Each document must expose its metadata and argument schema through a public API.
- Additional documents must not require manual registration or companion source files.
- File references must resolve relative to their containing document.
- Document identity must remain distinguishable across directories.
- Basic use must not require generated code.
- Programmatic use must share the same document format and contracts.

## Output and integration

- Resolution must preserve authored structure and correctly substitute supplied values.
- Consumers must be able to inspect resolved content before an application uses it.
- Application code must own data access, side effects, and application-specific execution.
- The document format must remain independent of a particular renderer.
- Extensions must use explicit public contracts without changes to the core parser.
- Normal use must not require consumers to construct or traverse internal parser nodes.
- Integrations must reuse host component contracts instead of duplicating their definitions.

## Interactive editing

- Host applications must be able to show and edit a document inline with a live preview.
- Normal editing must not require switching to raw markup or a separate form.
- The document file must remain the source of truth for both human and agent edits.
- Preview elements must retain their connection to the corresponding source ranges.
- Editing a value or section must preserve unrelated content, formatting, and metadata.
- Content an editor does not understand must survive editing and saving.
- Incomplete syntax must remain editable, with diagnostics attached to the affected source.
- Schema descriptions, defaults, and allowed values must be available to contextual controls.
- Preview and execution must use the same document meaning and resolution rules.
- Authoring a reusable document and supplying arguments for one use must remain distinguishable.
- Editor integration must not require a particular UI framework or editor library.

## Errors

- Syntax errors must identify the source file and location.
- Argument errors must identify the affected field and explain the problem.
- The system must preserve useful diagnostics from its underlying libraries.
- Invalid input must not silently produce misleading output.

## Engineering quality

- Public APIs must have precise types and useful JSDoc.
- Names must use established terms for the concepts they represent.
- Files and directories must have clear responsibilities.
- Abstractions must serve actual requirements.
- Existing libraries must supply parsing and file operations where they satisfy the requirements.
- Tests must cover complete paths from source files and supplied arguments to resolved output.
- Tests must combine supported features in practical documents.
- Tests must cover valid inputs, invalid inputs, boundary cases, and nested structures.
- Tests must cover module references, field metadata, defaults, argument selection, and type inference.
- Tests must cover file discovery, relative references, repeated use, and diagnostic locations.
- Output assertions must establish the intended content and structure, beyond successful execution.
