import { expect, test } from "vite-plus/test";
import { defineFileSystemStorage, getPath } from "package-management";
import { commands, load } from "../src/index.ts";

const fs = defineFileSystemStorage({ base: getPath(["<cwd>", "test/fixtures"]) });

test("discovers and renders a document without a configuration file", async () => {
  const cwd = fs.getFilePath("cli-project/sales");
  expect(await commands.list({ cwd })).toEqual(["notice.mdt"]);
  const [result] = await commands.render({ cwd, file: "notice.mdt" });
  expect(result.markdown).toBe("The release notes are ready for review.\n");
});

test("discovers documents and renders configured jobs from another working directory", async () => {
  const cwd = fs.getFilePath("cli-project");
  expect(await commands.list({ cwd })).toEqual([
    "operations/notice.mdt",
    "operations/retry.mdt",
    "sales/notice.mdt",
  ]);
  const results = await commands.render({ cwd });
  expect(results.map(({ output }) => output)).toEqual([
    fs.getFilePath("cli-project/output/notice.actual.md"),
  ]);
  expect(await fs.readFile("cli-project/output/notice.actual.md")).toBe(
    await fs.readFile("cli-project/output/notice.expected.md"),
  );
  const [updated] = await commands.render({
    cwd,
    file: "operations/notice.mdt",
    input: "updated.json",
    output: "output/updated.actual.md",
  });
  expect(updated.markdown).toBe(await fs.readFile("cli-project/output/updated.expected.md"));
  expect(await fs.readFile("cli-project/output/updated.actual.md")).toBe(updated.markdown);
});

test("resolves an explicit configuration and absolute document paths", async () => {
  const cwd = fs.getFilePath("workflow-documentation");
  const config = fs.getFilePath("cli-project/markdown-template.config.json");
  expect(await commands.list({ cwd, config })).toEqual([
    "operations/notice.mdt",
    "operations/retry.mdt",
    "sales/notice.mdt",
  ]);
  const [result] = await commands.render({
    cwd,
    config,
    file: fs.getFilePath("cli-project/sales/notice.mdt"),
  });
  expect(result.markdown).toBe("The release notes are ready for review.\n");
});

test("inspects native schema metadata and reports invalid arguments through ArkType", async () => {
  const cwd = fs.getFilePath("cli-project");
  const details = await commands.inspect({ cwd, file: "operations/notice.mdt" });
  expect(details.frontmatter.schema).toMatchObject({
    Notice: {
      timeoutMs: ["number", "@", { default: 5000, description: "Maximum request duration." }],
    },
  });
  const notice = await load({ file: fs.getFilePath("cli-project/operations/notice.mdt") });
  expect(details.input).toEqual(notice.input!.in.json);
  expect(details.output).toEqual(notice.input!.out.json);
  await expect(
    commands.render({
      cwd,
      file: "operations/notice.mdt",
      input: "invalid.json",
    }),
  ).rejects.toThrow(/service/);
});
