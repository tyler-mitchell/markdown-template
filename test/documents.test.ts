import { expect, test } from "vite-plus/test";
import { defineFileSystemStorage, getPath } from "package-management";
import { load } from "../src/document.ts";

const fixtures = defineFileSystemStorage({ base: getPath(["<cwd>", "test/fixtures"]) });
const cases = (await fixtures.storage.getKeys())
  .filter((key) => key.endsWith(".input.json"))
  .sort();

test.each(cases)("%s", async (key) => {
  const actualKey = key.replace(/\.input\.json$/, ".actual.md");
  await fixtures.storage.removeItem(actualKey);
  const input = JSON.parse((await fixtures.readFile(key))!);
  const document = await load({
    file: getPath({ to: ["<current_folder>", "template.mdt"], from: fixtures.getFilePath(key) }),
    fileSystemStorage: fixtures,
  });
  const expectedError = await fixtures.readFile(
    key.replace(/\.input\.json$/, ".expected-error.json"),
  );
  if (expectedError !== undefined) {
    expect(() => document.render(input)).toThrow(
      expect.objectContaining(JSON.parse(expectedError)),
    );
    return;
  }
  const expectedKey = key.replace(/\.input\.json$/, ".expected.md");
  const expected = await fixtures.readFile(expectedKey);
  expect(expected, `Missing expected Markdown for ${key}`).toBeDefined();
  const actual = document.render(input);
  await fixtures.createFile(actualKey, actual);
  expect(actual).toBe(expected);
  expect(await fixtures.storage.getItemRaw(actualKey)).toEqual(
    await fixtures.storage.getItemRaw(expectedKey),
  );
});
