// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  defineExtension,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import {
  $exportDocument,
  $importDocument,
  MarkdownExtension,
  TemplateExtension,
} from "@markdown-template/lexical";
import { compile } from "markdown-template";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { TemplateDocumentPlugin, TemplateEditor } from "./template-editor";

afterEach(cleanup);

test("local echoes preserve the caret, and host updates enter the same undo history", async () => {
  const source = `---
schema:
  Notice:
    service: string
input: Notice
---
# {{ service }}

Ready for review.
`;
  const document = compile(source);
  const editorRef = { current: null as LexicalEditor | null };
  const onChange = vi.fn();
  const extension = defineExtension({
    name: "test/host-document",
    dependencies: [MarkdownExtension, TemplateExtension],
    $initialEditorState: () => $importDocument(document),
  });
  const view = (document: ReturnType<typeof compile>) => (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <EditorRefPlugin editorRef={editorRef} />
      <TemplateDocumentPlugin document={document} onChange={onChange} />
      <ContentEditable aria-label="Template document" />
    </LexicalExtensionComposer>
  );
  const mounted = render(view(document));
  const editor = editorRef.current!;
  act(() =>
    editor.update(
      () => {
        const text = $getRoot().getAllTextNodes().at(-1)!;
        text.selectEnd().insertText(" Please reply today.");
      },
      { discrete: true },
    ),
  );
  const edited = editor.read($exportDocument);
  expect(onChange).toHaveBeenLastCalledWith(edited);
  const caret = editor.read(() => {
    const selection = $getSelection();
    return $isRangeSelection(selection)
      ? { key: selection.anchor.key, offset: selection.anchor.offset }
      : null;
  });
  mounted.rerender(view(compile(edited)));
  expect(
    editor.read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection)
        ? { key: selection.anchor.key, offset: selection.anchor.offset }
        : null;
    }),
  ).toEqual(caret);
  expect(onChange).toHaveBeenCalledTimes(1);

  const external = edited.replace(
    "Ready for review. Please reply today.",
    "Approved for delivery.",
  );
  mounted.rerender(view(compile(external)));
  await waitFor(() => expect(editor.read($exportDocument)).toBe(external));
  expect(mounted.getByText("Approved for delivery.")).toBeTruthy();
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(compile(editor.read($exportDocument)).render({ service: "Asset API" })).toBe(
    "# Asset API\n\nApproved for delivery.\n",
  );

  act(() => editor.dispatchCommand(UNDO_COMMAND, undefined));
  await waitFor(() => expect(editor.read($exportDocument)).toBe(edited));
  expect(onChange).toHaveBeenLastCalledWith(edited);
});

test("the Base UI field picker changes a formatted reference through the shared editor", async () => {
  const source = `---
schema:
  Invitation:
    recipient: string
    sender: string
input: Invitation
---
Hello **{{ recipient }}**, your review is ready.
`;
  const onChange = vi.fn();
  const view = render(<TemplateEditor document={compile(source)} onChange={onChange} />);
  fireEvent.click(view.getByText("recipient"));
  const input = await view.findByLabelText("Template field");
  expect((input as HTMLInputElement).value).toBe("recipient");
  fireEvent.change(input, { target: { value: "sender" } });
  fireEvent.click(await view.findByRole("option", { name: /sender/ }));
  await waitFor(() =>
    expect(onChange).toHaveBeenLastCalledWith(source.replace("{{ recipient }}", "{{ sender }}")),
  );
  expect(compile(onChange.mock.lastCall![0]).render({ recipient: "Maya", sender: "Luis" })).toBe(
    "Hello **Luis**, your review is ready.\n",
  );
  expect(view.queryByLabelText("Template field")).toBeNull();
});
