import assert from "node:assert/strict";
import { type } from "arktype";
import { compile } from "markdown-template";

assert.equal(compile("# Hello {{name}}").render({ name: "World" }), "# Hello World");

const document = compile(`---
schema:
  Input:
    timeoutMs: ["number", "@", { default: 5000, description: "Maximum request duration." }]
input: Input
---
Timeout: {{timeoutMs}}`);

assert.equal(document.render({}), "Timeout: 5000");
assert.equal(document.input.props[0].value.meta.description, "Maximum request duration.");

const schema = type.module({
  Retry: {
    delayMs: "string.numeric.parse",
    attempts: type("number > 0").configure({ description: "Maximum attempts." }).default(3),
  },
});
const retry = compile("Retry after {{ delayMs }} ms.", { schema, input: "Retry" });
assert.equal(retry.schemas, schema);
assert.equal(retry.input, schema.Retry);
const validated = await retry.standard.validate({ delayMs: "2500" });
assert.ok(!validated.issues);
assert.deepEqual(validated, await schema.Retry["~standard"].validate({ delayMs: "2500" }));
assert.deepEqual(validated.value, { delayMs: 2500, attempts: 3 });
assert.equal(retry.input.out.get("attempts").meta.description, "Maximum attempts.");
assert.equal(retry.renderValidated(validated.value), "Retry after 2500 ms.");
assert.equal(retry.render({ delayMs: "2500" }), "Retry after 2500 ms.");
assert.equal(retry.content.slice(retry.children[0].offset, retry.children[0].end), "{{ delayMs }}");
assert.equal("tree" in retry.children[0], false);
