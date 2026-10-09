import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { HistoryExtension } from "@lexical/history";
import { configExtension, HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG, UNDO_COMMAND } from "lexical";
import { compile } from "markdown-template";
import { expect, test, vi } from "vite-plus/test";
import { $exportDocument, $importDocument, TemplateExtension } from "../src";

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
