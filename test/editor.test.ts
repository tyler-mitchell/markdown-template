import { assert, expect, test } from "vite-plus/test";
import { type } from "arktype";
import { compile } from "../src/index.ts";

test("builds a contextual choice control from the compiled schema and previews a selection", () => {
  const document = compile("Send the release notes by {{ channel }}.", {
    schema: type.module({
      Channel: [
        "'email' | 'slack'",
        "@",
        { description: "Where the release notes will be delivered." },
      ],
      Delivery: { channel: ["Channel", "@", { default: "email" }] },
    }),
    input: "Delivery",
  });
  const field = document.input.out.get("channel");
  const control = {
    description: field.meta.description,
    defaultValue: field.meta.default,
    choices: field.select("unit").map((option) => option.unit),
  };

  expect(control).toEqual({
    description: "Where the release notes will be delivered.",
    defaultValue: "email",
    choices: ["email", "slack"],
  });
  expect(document.render({})).toBe("Send the release notes by email.");
  const channel = field.assert(control.choices[1]);
  expect(document.renderValidated({ channel })).toBe("Send the release notes by slack.");
  expect(document.render({})).toBe("Send the release notes by email.");
  expect(document.source).toBe("Send the release notes by {{ channel }}.");
});

test("reports an invalid inline value at its field and renders the corrected draft", () => {
  const document = compile("Request timeout: {{ timeoutMs }} ms.", {
    schema: type.module({
      Settings: {
        timeoutMs: [
          "number > 0",
          "@",
          { default: 5000, description: "Maximum request duration in milliseconds." },
        ],
      },
    }),
    input: "Settings",
  });
  const invalidDraft = document.input({ timeoutMs: -1 });
  assert(invalidDraft instanceof type.errors);
  expect(Object.keys(invalidDraft.flatProblemsByPath)).toEqual(["timeoutMs"]);
  expect(invalidDraft.flatProblemsByPath.timeoutMs).toHaveLength(1);

  const correctedDraft = document.input({ timeoutMs: 2000 });
  assert(!(correctedDraft instanceof type.errors));
  expect(correctedDraft).toEqual({ timeoutMs: 2000 });
  expect(document.renderValidated(correctedDraft)).toBe("Request timeout: 2000 ms.");
  expect(document.render({})).toBe("Request timeout: 5000 ms.");
});

test("edits one repeated placeholder by its range without rewriting metadata or other content", () => {
  const document = compile(`---
title: Review invitation
description: "Keep {{ recipient }} available in the invitation."
schema:
  Invitation:
    recipient: string
    reviewer: string
input: Invitation
---
# Design review ✨

Hello **{{ recipient }}**.

Reviewer: {{ recipient }}.

<!-- Keep this annotation. -->
`);
  const placeholders = document.children.filter((part) => part.kind === "expression");
  expect(placeholders.map((part) => document.content.slice(part.offset, part.end))).toEqual([
    "{{ recipient }}",
    "{{ recipient }}",
  ]);
  const selected = placeholders[1];
  const editedSource =
    document.source.slice(0, document.contentOffset + selected.offset) +
    "{{ reviewer }}" +
    document.source.slice(document.contentOffset + selected.end);
  const edited = compile(editedSource);

  expect(edited.source).toBe(`---
title: Review invitation
description: "Keep {{ recipient }} available in the invitation."
schema:
  Invitation:
    recipient: string
    reviewer: string
input: Invitation
---
# Design review ✨

Hello **{{ recipient }}**.

Reviewer: {{ reviewer }}.

<!-- Keep this annotation. -->
`);
  expect(edited.frontmatter).toEqual(document.frontmatter);
  expect(edited.render({ recipient: "Maya", reviewer: "Luis" })).toBe(`# Design review ✨

Hello **Maya**.

Reviewer: Luis.

<!-- Keep this annotation. -->
`);
  expect(document.content.slice(selected.offset, selected.end)).toBe("{{ recipient }}");
});

test("edits a conditional section using compiled body ranges and previews both states", () => {
  const document = compile(`# Delivery

The release is ready.

<$show if={includeSupport}>
  ## Support

  Contact {{ contact }}.
</$show>

Keep your delivery receipt.
`);
  const section = document.children.find((part) => part.kind === "element");
  assert(section);
  expect(section.name).toBe("show");
  expect(document.content.slice(section.bodyOffset, section.bodyEnd)).toBe(`  ## Support

  Contact {{ contact }}.
`);
  const edited = compile(
    document.content.slice(0, section.bodyOffset) +
      `  ## Support

  Email {{ contact }} with your receipt number.
` +
      document.content.slice(section.bodyEnd),
  );

  expect(edited.render({ includeSupport: true, contact: "help@example.com" })).toBe(`# Delivery

The release is ready.

## Support

Email help@example.com with your receipt number.

Keep your delivery receipt.
`);
  expect(edited.render({ includeSupport: false, contact: "help@example.com" })).toBe(`# Delivery

The release is ready.


Keep your delivery receipt.
`);
  expect(edited.source.slice(0, section.bodyOffset)).toBe(
    document.source.slice(0, section.bodyOffset),
  );
  const editedSection = edited.children.find((part) => part.kind === "element");
  assert(editedSection);
  expect(edited.content.slice(editedSection.bodyEnd)).toBe(document.content.slice(section.bodyEnd));
});
