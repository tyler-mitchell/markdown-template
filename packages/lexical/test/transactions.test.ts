import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { HistoryExtension } from "@lexical/history";
import {
  $getRoot,
  configExtension,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  UNDO_COMMAND,
} from "lexical";
import { compile } from "markdown-template";
import { expect, test, vi } from "vite-plus/test";
import {
  $createTemplateExpression,
  $exportDocument,
  $importDocument,
  MarkdownExtension,
  TemplateExtension,
} from "../src";

test("notifies the host of a source update and lets the user undo it", () => {
  const source = `---
schema:
  Notice:
    release_name: ["string", "@", { default: "Unreleased", description: "Release label." }]
input: Notice
---
# {{ release_name }}

Ready for review.
`;
  const editor = buildEditorFromExtensions(
    HeadlessExtension,
    MarkdownExtension,
    TemplateExtension,
    configExtension(HistoryExtension, { disabled: false }),
  );
  const onChange = vi.fn();
  const unregister = editor.registerUpdateListener(({ editorState }) => {
    onChange(editorState.read($exportDocument));
  });
  editor.update(() => $importDocument(compile(source)), { discrete: true });

  const updatedSource = source.replace("Ready for review.", "Ready for final approval.");
  editor.update(() => $importDocument(compile(updatedSource)), {
    discrete: true,
    tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG],
  });
  expect(onChange).toHaveBeenLastCalledWith(updatedSource);
  expect(compile(editor.read($exportDocument)).render({})).toBe(
    "# Unreleased\n\nReady for final approval.\n",
  );

  editor.dispatchCommand(UNDO_COMMAND, undefined);
  expect(editor.read($exportDocument)).toBe(source);
  expect(onChange).toHaveBeenLastCalledWith(source);
  unregister();
  editor.dispose();
});

test("a selected field remains a binding through export, serialization, and undo", () => {
  const source = `---
schema:
  Notice:
    service: string
    version: ["string", "@", { default: "Unreleased", description: "Release label." }]
input: Notice
---
# {{ service }}

Release: draft
`;
  const editor = buildEditorFromExtensions(
    HeadlessExtension,
    MarkdownExtension,
    TemplateExtension,
    configExtension(HistoryExtension, { disabled: false }),
  );
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes().at(-1)!;
      const [, draft] = text.splitText("Release: ".length);
      draft.replace($createTemplateExpression("{{ version }}"));
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  );

  const exported = editor.read($exportDocument);
  expect(exported).toBe(source.replace("Release: draft", "Release: {{ version }}"));
  expect(compile(exported).render({ service: "Asset API" })).toBe(
    "# Asset API\n\nRelease: Unreleased\n",
  );
  expect(compile(exported).render({ service: "Asset API", version: "2.1" })).toBe(
    "# Asset API\n\nRelease: 2.1\n",
  );

  const restored = buildEditorFromExtensions(
    HeadlessExtension,
    MarkdownExtension,
    TemplateExtension,
  );
  restored.setEditorState(
    restored.parseEditorState(JSON.stringify(editor.getEditorState().toJSON())),
  );
  expect(restored.read($exportDocument)).toBe(exported);
  editor.dispatchCommand(UNDO_COMMAND, undefined);
  expect(editor.read($exportDocument)).toBe(source);
  restored.dispose();
  editor.dispose();
});
