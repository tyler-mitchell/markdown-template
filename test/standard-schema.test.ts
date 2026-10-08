import { assert, expect, expectTypeOf, test } from "vite-plus/test";
import { type } from "arktype";
import { compile, load } from "../src/index.ts";
import integrationInput from "./fixtures/api-integration/staging.input.json";
import integrationExpected from "./fixtures/api-integration/staging.expected.md?raw";

test("supplies the native Standard Schema interface to a settings consumer", async () => {
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
  const standard = document.standard;
  expect(document.input).toBe(document.schemas.Settings);
  expect(standard.vendor).toBe("arktype");
  expect(standard.version).toBe(1);

  const defaults = await standard.validate({});
  assert(!defaults.issues);
  expect(defaults).toEqual(await document.input["~standard"].validate({}));
  expectTypeOf(defaults.value).toEqualTypeOf<{ timeoutMs: number }>();
  expect(defaults.value).toEqual({ timeoutMs: 5000 });
  expect(document.renderValidated(defaults.value)).toBe("Request timeout: 5000 ms.");

  const invalid = await standard.validate({ timeoutMs: -1 });
  assert(invalid.issues);
  expect(invalid.issues).toHaveLength(1);
  const path = invalid.issues[0].path;
  assert(path);
  expect(Array.from(path)).toEqual(["timeoutMs"]);

  expect(standard.jsonSchema.input({ target: "draft-2020-12" })).toMatchObject({
    type: "object",
    properties: {
      timeoutMs: {
        type: "number",
        description: "Maximum request duration in milliseconds.",
      },
    },
  });
});

test("renders converted durations without applying the same numeric transform twice", async () => {
  const document = compile("Retry after {{ delay }} ms.", {
    schema: type.module({
      Retry: {
        delay: type("number >= 0").pipe((seconds) => seconds * 1000),
      },
    }),
    input: "Retry",
  });
  const result = await document.standard.validate({ delay: 2 });
  assert(!result.issues);

  expect(result.value).toEqual({ delay: 2000 });
  expect(document.renderValidated(result.value)).toBe("Retry after 2000 ms.");
  expect(document.render({ delay: 2 })).toBe("Retry after 2000 ms.");
  expect(document.renderValidated(result.value)).toBe("Retry after 2000 ms.");
});

test("distinguishes raw configuration from native transformed output", async () => {
  const document = compile("Retry delay: {{ delayMs }} ms.", {
    schema: type.module({
      RetryPolicy: { delayMs: "string.numeric.parse" },
    }),
    input: "RetryPolicy",
  });
  const raw: unknown = { delayMs: "2500" };
  const result = await document.standard.validate(raw);
  assert(!result.issues);

  expectTypeOf(result.value).toEqualTypeOf<{ delayMs: number }>();
  expect(result.value).toEqual({ delayMs: 2500 });
  expect(document.renderValidated(result.value)).toBe("Retry delay: 2500 ms.");
  expect(document.render({ delayMs: "2500" })).toBe("Retry delay: 2500 ms.");
  expect(raw).toEqual({ delayMs: "2500" });
  expectTypeOf<typeof document.input.inferIn>().toEqualTypeOf<{ delayMs: string }>();
  expectTypeOf<typeof document.input.infer>().toEqualTypeOf<{ delayMs: number }>();
});

test("validates a file-authored contract without pretending its types were known at build time", async () => {
  const document = await load({ file: "test/fixtures/api-integration/template.mdt" });
  assert(document.standard);
  const result = await document.standard.validate(integrationInput);
  assert(!result.issues);

  expectTypeOf(result.value).toBeUnknown();
  expect(document.file).toMatch(/\/test\/fixtures\/api-integration\/template\.mdt$/);
  expect(document.frontmatter.title).toBe("Event ingestion integration");
  expect(document.renderValidated(result.value)).toBe(integrationExpected);
});
