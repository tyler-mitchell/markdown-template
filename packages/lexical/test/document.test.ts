import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { $getRoot } from "lexical";
import { compile } from "markdown-template";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import {
  TemplateExtension,
  $exportDocument,
  $importDocument,
  TemplateExpressionNode,
} from "../src";
import escalation from "../../../test/fixtures/support-escalation/template.mdt?raw";
import escalationInput from "../../../test/fixtures/support-escalation/structured-steps.input.json";
import escalationExpected from "../../../test/fixtures/support-escalation/structured-steps.expected.md?raw";

const source = `---
title: Release notice
schema:
  Change:
    title: string
    description: string
  Release:
    version: string
    changes: Change[]
input: Release
---
# Release {{ version }}

This release includes:

<$each items={changes} as="change">
  - **{{ change.title }}**: {{ change.description }}
</$each>
`;

test("edits a release introduction while retaining its schema and repeated change list", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const introduction = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "This release includes:")!;
      introduction.setTextContent("Ready for your team:");
    },
    { discrete: true },
  );
  const edited = editor.read($exportDocument);
  const document = compile(edited);
  expect(document.frontmatter).toEqual(compile(source).frontmatter);
  expect(
    document.render({
      version: "2.4",
      changes: [{ title: "Shared drafts", description: "Review changes together." }],
    }),
  ).toBe(
    "# Release 2.4\n\nReady for your team:\n\n- **Shared drafts**: Review changes together.\n",
  );
  expect(
    editor.read(() =>
      $getRoot()
        .getAllTextNodes()
        .filter((node) => node instanceof TemplateExpressionNode)
        .map((node) => node.getTextContent()),
    ),
  ).toEqual(["{{ version }}", "{{ change.title }}", "{{ change.description }}"]);
  editor.dispose();
});

test("retains nested each and match sections in an engineering escalation", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(escalation)), { discrete: true });
  const source = editor.read($exportDocument);
  const document = compile(source);
  const markdown = new MarkdownIt();
  expect(document.frontmatter).toEqual(compile(escalation).frontmatter);
  expect(markdown.render(document.render(escalationInput))).toBe(
    markdown.render(escalationExpected),
  );
  expect(source).toContain('<$case type="Step">');
  editor.dispose();
});

test("edits an interpolation in place through a Lexical text selection", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const version = $getRoot()
        .getAllTextNodes()
        .find(
          (node) =>
            node instanceof TemplateExpressionNode && node.getTextContent() === "{{ version }}",
        )!;
      version.select(3, 10).insertText("version.toUpperCase()");
    },
    { discrete: true },
  );
  const edited = editor.read($exportDocument);
  expect(edited).toContain("{{ version.toUpperCase() }}");
  expect(compile(edited).render({ version: "2.4-rc1", changes: [] })).toContain(
    "# Release 2.4-RC1",
  );
  editor.dispose();
});

test("edits a repeated section's expression directly in the document", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const opening = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === '<$each items={changes} as="change">')!;
      const start = opening.getTextContent().indexOf("changes");
      opening.select(start, start + "changes".length).insertText("changes.slice(0, 1)");
    },
    { discrete: true },
  );
  const edited = editor.read($exportDocument);
  expect(edited).toContain('<$each items={changes.slice(0, 1)} as="change">');
  expect(
    compile(edited).render({
      version: "2.4",
      changes: [
        { title: "Shared drafts", description: "Review changes together." },
        { title: "Faster uploads", description: "Upload files in parallel." },
      ],
    }),
  ).toBe(
    "# Release 2.4\n\nThis release includes:\n\n- **Shared drafts**: Review changes together.\n",
  );
  editor.dispose();
});
