// @vitest-environment happy-dom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { $getRoot, defineExtension, type LexicalEditor, UNDO_COMMAND } from "lexical";
import { DocumentEditor, DocumentExtension } from "@markdown-template/editor";
import { afterEach, expect, test, vi } from "vite-plus/test";
import notes from "../../documents/release-plan.md?raw";

afterEach(cleanup);

test("the shared document surface edits Markdown without a template or permanent toolbar", async () => {
  const editorRef = { current: null as LexicalEditor | null };
  const onChange = vi.fn();
  const extension = defineExtension({
    name: "test/project-notes",
    dependencies: [DocumentExtension],
    $initialEditorState: () => $convertFromMarkdownString(notes, TRANSFORMERS),
  });
  const view = render(
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <EditorRefPlugin editorRef={editorRef} />
      <DocumentEditor />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(state) => onChange(state.read(() => $convertToMarkdownString(TRANSFORMERS)))}
      />
    </LexicalExtensionComposer>,
  );
  expect(view.getByRole("heading", { name: "Asset library release" })).toBeTruthy();
  expect(view.queryByRole("toolbar")).toBeNull();
  expect(view.queryByRole("combobox")).toBeNull();
  const editor = editorRef.current!;
  const before = editor.read(() => $convertToMarkdownString(TRANSFORMERS));
  act(() =>
    editor.update(
      () => {
        $getRoot().getAllTextNodes().at(-1)!.selectEnd().insertText(" Load previews on demand.");
      },
      { discrete: true },
    ),
  );
  await waitFor(() =>
    expect(onChange).toHaveBeenLastCalledWith(`${before} Load previews on demand.`),
  );
  expect(view.getByRole("heading", { name: "Handoff" })).toBeTruthy();
  act(() => editor.dispatchCommand(UNDO_COMMAND, undefined));
  await waitFor(() =>
    expect(editor.read(() => $convertToMarkdownString(TRANSFORMERS))).toBe(before),
  );
});
