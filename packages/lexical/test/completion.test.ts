import { buildEditorFromExtensions } from "@lexical/extension";
import { HeadlessExtension } from "@lexical/headless";
import { $getRoot, $getState, $nodesOfType, configExtension } from "lexical";
import { compile } from "markdown-template";
import { expect, test } from "vite-plus/test";
import {
  $createTemplateExpression,
  $editTemplateExpression,
  $cancelTemplateInput,
  $exportDocument,
  $importDocument,
  MarkdownExtension,
  TemplateExtension,
  TemplateInputNode,
  TemplateSourceNode,
  sourceState,
} from "../src";

test.each(["{{", "@", "/field"])(
  "%s opens an empty field and preserves the template",
  (trigger) => {
    const source = `---
schema:
  Release:
    service: string
    version: string
input: Release
---
# {{ service }}

Release: choose
`;
    const editor = buildEditorFromExtensions(
      HeadlessExtension,
      MarkdownExtension,
      configExtension(TemplateExtension, { trigger }),
    );
    editor.update(() => $importDocument(compile(source)), { discrete: true });
    editor.update(
      () => {
        const text = $getRoot().getAllTextNodes().at(-1)!;
        text.select("Release: ".length, text.getTextContentSize()).insertText(trigger);
      },
      { discrete: true },
    );
    editor.read(() => {
      const inputs = $nodesOfType(TemplateInputNode);
      expect(inputs).toHaveLength(1);
      expect(inputs[0].getTextContent()).toBe("");
      expect($getRoot().getTextContent()).not.toContain(trigger);
      expect(compile($exportDocument()).content).not.toContain("choose");
    });

    editor.update(
      () => {
        const input = $nodesOfType(TemplateInputNode)[0];
        input.replace($createTemplateExpression("{{ version }}")).selectNext();
      },
      { discrete: true },
    );

    const exported = editor.read($exportDocument);
    expect(exported).toBe(source.replace("choose", "{{ version }}"));
    expect(compile(exported).render({ service: "Asset API", version: "2.2" })).toBe(
      "# Asset API\n\nRelease: 2.2\n",
    );
    editor.dispose();
  },
);

test("reopening and cancelling a reference preserves the original expression and formatting", () => {
  const source = `---
schema:
  Invitation:
    recipient: string
    sender: string
input: Invitation
---
Hello **{{ recipient }}**, your review is ready.
`;
  const editor = buildEditorFromExtensions(HeadlessExtension, MarkdownExtension, TemplateExtension);
  editor.update(() => $importDocument(compile(source)), { discrete: true });
  editor.update(
    () => {
      $editTemplateExpression($nodesOfType(TemplateSourceNode)[0]);
    },
    { discrete: true },
  );
  expect(editor.read($exportDocument)).toBe(source);
  editor.read(() => {
    const input = $nodesOfType(TemplateInputNode)[0];
    expect($getState(input, sourceState)).toBe("{{ recipient }}");
    expect(input.hasFormat("bold")).toBe(true);
  });
  editor.update(
    () => {
      $cancelTemplateInput($nodesOfType(TemplateInputNode)[0]);
    },
    { discrete: true },
  );
  expect(editor.read($exportDocument)).toBe(source);
  editor.update(
    () => {
      const input = $editTemplateExpression($nodesOfType(TemplateSourceNode)[0]);
      input.replace($createTemplateExpression("{{ sender }}").setFormat(input.getFormat()));
    },
    { discrete: true },
  );
  expect(compile(editor.read($exportDocument)).render({ recipient: "Maya", sender: "Luis" })).toBe(
    "Hello **Luis**, your review is ready.\n",
  );
  editor.dispose();
});
