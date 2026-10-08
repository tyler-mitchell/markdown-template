import assert from "node:assert/strict";
import { compile } from "markdown-template";

assert.equal(compile("# Hello {name}").render({ name: "World" }), "# Hello World");

const document = compile(`---
schema:
  Input:
    timeoutMs: ["number", "@", { default: 5000, description: "Maximum request duration." }]
input: Input
---
Timeout: {timeoutMs}`);

assert.equal(document.render({}), "Timeout: 5000");
assert.equal(document.input.props[0].value.meta.description, "Maximum request duration.");
