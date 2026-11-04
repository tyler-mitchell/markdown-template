import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { $getRoot, $getSelection, $getState, $setState } from "lexical";
import { compile, TemplateSyntaxError } from "markdown-template";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import {
  MarkdownExtension,
  TemplateExtension,
  $exportDocument,
  $importDocument,
  TemplateSourceNode,
  TemplateBlockNode,
  sourceState,
  $createTemplateExpression,
} from "../src";
import escalation from "../../../test/fixtures/support-escalation/template.mdt?raw";
import escalationInput from "../../../test/fixtures/support-escalation/structured-steps.input.json";
import escalationExpected from "../../../test/fixtures/support-escalation/structured-steps.expected.md?raw";
import workflowSource from "../../../test/fixtures/workflow-documentation/template.mdt?raw";
import workflowInput from "../../../test/fixtures/workflow-documentation/workflow.input.json";
import workflowExpected from "../../../test/fixtures/workflow-documentation/workflow.expected.md?raw";
import deploySource from "../../../test/fixtures/workflow-documentation/deploy.yml?raw";
import noticeSource from "../../../test/fixtures/workflow-documentation/notice.mdt?raw";

const fixtureSources = import.meta.glob<string>("../../../test/fixtures/**/*.mdt", {
  eager: true,
  query: "?raw",
  import: "default",
});
const fixtureInputs = import.meta.glob<Record<string, unknown>>(
  "../../../test/fixtures/**/*.input.json",
  {
    eager: true,
    import: "default",
  },
);

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

test("imports a reading view without turning Markdown separators into empty paragraphs", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(
    () => $importDocument(compile("# Brief\n\nReference: {{ subject }}\n\nInstructions."), false),
    { discrete: true },
  );
  expect(
    editor.read(() =>
      $getRoot()
        .getChildren()
        .map((node) => node.getTextContent()),
    ),
  ).toEqual(["Brief", "Reference: subject", "Instructions."]);
  editor.dispose();
});

test("edits a release introduction while retaining its schema and repeated change list", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
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
        .filter(
          (node) =>
            node instanceof TemplateSourceNode && $getState(node, sourceState).startsWith("{{"),
        )
        .map((node) => $getState(node, sourceState)),
    ),
  ).toEqual(["{{ version }}", "{{ change.title }}", "{{ change.description }}"]);
  editor.dispose();
});

test("retains nested each and match sections in an engineering escalation", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
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

test("replaces an interpolation badge in a Lexical transaction", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const version = $getRoot()
        .getAllTextNodes()
        .find(
          (node) =>
            node instanceof TemplateSourceNode && $getState(node, sourceState) === "{{ version }}",
        )!;
      version.replace($createTemplateExpression("{{ version.toUpperCase() }}"));
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

test("changes a repeated section while retaining its document content", () => {
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const opening = $getRoot()
        .getChildren()
        .find((node) => node instanceof TemplateBlockNode)!;
      $setState(opening, sourceState, '<$each items={changes.slice(0, 1)} as="change">');
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

test.each([
  ["api-integration", "staging"],
  ["container-build", "asset-api"],
  ["symbol-search", "anchored"],
  ["customer-quote", "accessibility-audit"],
  ["meeting-follow-up", "migration-planning"],
  ["incident-handoff", "upload-failure"],
])("preserves %s template meaning through an unrelated introduction edit", (fixture, input) => {
  const prefix = `../../../test/fixtures/${fixture}/`;
  const source = fixtureSources[`${prefix}template.mdt`];
  const includes =
    fixture === "symbol-search"
      ? { "./symbol.mdt": compile(fixtureSources[`${prefix}symbol.mdt`]) }
      : undefined;
  const document = compile(source, { includes });
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(document), { discrete: true });
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes()[0];
      text.select(0, 0).insertText("Updated: ");
    },
    { discrete: true },
  );
  const edited = compile(editor.read($exportDocument), { includes });
  expect(edited.frontmatter).toEqual(document.frontmatter);
  expect(
    new MarkdownIt().render(edited.render(fixtureInputs[`${prefix}${input}.input.json`])),
  ).toBe(
    new MarkdownIt()
      .render(document.render(fixtureInputs[`${prefix}${input}.input.json`]))
      .replace(/(<h1>|<p>)/, "$1Updated: "),
  );
  editor.dispose();
});

test("keeps a multiline release label expression when editing its introduction", () => {
  const expression = '{{ version\n  .replace("-rc1", " **release candidate**")\n}}';
  const template = source.replace(
    "This release includes:",
    `This release includes:\n\nRelease label: ${expression}`,
  );
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(template)), { discrete: true });
  editor.update(
    () => {
      const introduction = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "This release includes:")!;
      introduction.select(0, 0).insertText("For your team: ");
    },
    { discrete: true },
  );
  const exported = editor.read($exportDocument);
  expect(exported).toContain(expression);
  expect(
    compile(exported).render({
      version: "2.4-rc1",
      changes: [{ title: "Shared drafts", description: "Review changes together." }],
    }),
  ).toBe(
    "# Release 2.4-rc1\n\nFor your team: This release includes:\n\nRelease label: 2.4 **release candidate**\n\n- **Shared drafts**: Review changes together.\n",
  );
  editor.dispose();
});

test("retains raw file includes and literal template examples while editing deployment instructions", () => {
  const includes = {
    "deploy.yml": deploySource,
    "notice.mdt": compile(noticeSource),
  };
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(workflowSource, { includes })), { discrete: true });
  editor.update(
    () => {
      const introduction = $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "Save this workflow in ")!;
      introduction.select(0, 4).insertText("Keep");
    },
    { discrete: true },
  );
  const exported = editor.read($exportDocument);
  expect(compile(exported, { includes }).render(workflowInput)).toBe(
    workflowExpected.replace("Save this workflow", "Keep this workflow"),
  );
  editor.dispose();
});

test("preserves formatting inside directives and around schema fields with underscores", () => {
  const source = `---
schema:
  Notice:
    release_name: string
    ready: boolean
input: Notice
---
**{{ release_name }}**<$show if={ready}> — **Ready for review**</$show>.

Release identifier: \`{{ release_name }}\`.
`;
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  const exported = editor.read($exportDocument);
  expect(exported).toBe(source);
  expect(compile(exported).render({ release_name: "Asset API 2.4", ready: true })).toBe(
    "**Asset API 2.4** — **Ready for review**.\n\nRelease identifier: `Asset API 2.4`.\n",
  );
  editor.dispose();
});

test.each(["insertText", "insertRawText"] as const)(
  "%s adds a schema reference to ordinary document text",
  (method) => {
    const source = `---
schema:
  Release:
    release_name: string
input: Release
---
Release: draft
`;
    const editor = buildEditorFromExtensions(
      HeadlessExtension,
      MarkdownExtension,
      TemplateExtension,
    );
    editor.update(() => $importDocument(compile(source)), { discrete: true });
    editor.update(
      () => {
        const text = $getRoot().getAllTextNodes()[0];
        text.select(9, 14)[method]("{{ release_name }}");
      },
      { discrete: true },
    );
    const exported = editor.read($exportDocument);
    expect(exported).toBe(source.replace("draft", "{{ release_name }}"));
    expect(compile(exported).render({ release_name: "Asset API 2.4" })).toBe(
      "Release: Asset API 2.4\n",
    );
    editor.dispose();
  },
);

test("keeps an incomplete schema reference editable until typing completes it", () => {
  const source = `---
schema:
  Release:
    release_name: string
input: Release
---
Release: draft
`;
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0].select(9, 14).insertText("{{ release_");
    },
    { discrete: true },
  );
  expect(editor.read($exportDocument)).toBe(source.replace("draft", "{{ release_"));
  expect(() => compile(editor.read($exportDocument))).toThrow(TemplateSyntaxError);
  editor.update(
    () => {
      $getSelection()!.insertText("name }} / {{ release_name.toUpperCase() }}");
    },
    { discrete: true },
  );
  expect(compile(editor.read($exportDocument)).render({ release_name: "Asset API 2.4" })).toBe(
    "Release: Asset API 2.4 / ASSET API 2.4\n",
  );
  editor.dispose();
});

test("pastes a conditional review status without escaping its Markdown", () => {
  const source = `---
schema:
  Review:
    ready: boolean
input: Review
---
Review status: draft
`;
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      $getRoot()
        .getAllTextNodes()[0]
        .select(15, 20)
        .insertRawText("<$show if={ready}>**Ready for review**</$show>");
    },
    { discrete: true },
  );
  expect(compile(editor.read($exportDocument)).render({ ready: true })).toBe(
    "Review status: **Ready for review**\n",
  );
  editor.dispose();
});
