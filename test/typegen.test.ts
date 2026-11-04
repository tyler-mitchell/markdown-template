import { expect, expectTypeOf, test } from "vite-plus/test";
import { defineFileSystemStorage, getPath } from "package-management";
import { commands, load } from "../src/index.ts";
import type notice from "./fixtures/cli-project/operations/notice.mdt";
import type retry from "./fixtures/cli-project/operations/retry.mdt";
import type sales from "./fixtures/cli-project/sales/notice.mdt";

const fs = defineFileSystemStorage({ base: getPath(["<cwd>", "test/fixtures/cli-project"]) });
const cwd = fs.getFilePath("");

test("generates contracts that distinguish defaults and transformed arguments", async () => {
  await commands.typegen({ cwd });
  expectTypeOf<typeof notice.input.inferIn>().toEqualTypeOf<{
    service: string;
    timeoutMs?: number;
  }>();
  expectTypeOf<typeof notice.input.infer>().toEqualTypeOf<{
    service: string;
    timeoutMs: number;
  }>();
  expectTypeOf<typeof retry.schemas.Decision.infer>().toEqualTypeOf<"retry" | "stop">();
  expectTypeOf<typeof retry.input.inferIn>().toEqualTypeOf<{
    service: string;
    decision: "retry" | "stop";
    delayMs: string;
    reason?: string;
  }>();
  expectTypeOf<typeof retry.input.infer>().toEqualTypeOf<{
    service: string;
    decision: "retry" | "stop";
    delayMs: number;
    reason?: string;
  }>();
  expectTypeOf<typeof sales.input>().toBeUndefined();
  const source = await fs.readFile("operations/notice.d.mdt.ts");
  expect(source).toContain("Maximum request duration.");
  const [result] = await commands.render({
    cwd,
    file: "operations/retry.mdt",
    input: "retry.json",
    output: "output/retry.actual.md",
  });
  expect(result.markdown).toBe(await fs.readFile("output/retry.expected.md"));
  const document = await load({ file: fs.getFilePath("operations/retry.mdt") });
  expect(document.input!.assert(JSON.parse((await fs.readFile("retry.json"))!))).toEqual({
    service: "Artifact processor",
    decision: "retry",
    delayMs: 2500,
    reason: "The upstream service is restarting.",
  });
});

test("removes owned stale declarations and preserves files changed by the consumer", async () => {
  const config = "regeneration.config.json";
  await fs.createFile(
    config,
    JSON.stringify({
      include: ["operations/*.mdt"],
      types: { outDir: "generated" },
    }),
  );
  try {
    await commands.typegen({ cwd, config });
    const original = await fs.readFile("generated/operations/notice.d.mdt.ts");
    expect(original).toContain("CompiledDocument");
    await fs.createFile("generated/operations/retry.d.mdt.ts", "// Consumer-owned edits.\n");
    await fs.createFile(
      config,
      JSON.stringify({
        include: ["sales/*.mdt"],
        types: { outDir: "generated" },
      }),
    );
    await commands.typegen({ cwd, config });
    expect(await fs.readFile("generated/operations/notice.d.mdt.ts")).toBeUndefined();
    expect(await fs.readFile("generated/operations/retry.d.mdt.ts")).toBe(
      "// Consumer-owned edits.\n",
    );
    expect(await fs.readFile("generated/sales/notice.d.mdt.ts")).toContain("CompiledDocument");
  } finally {
    await fs.storage.removeItem(config);
    await fs.storage.removeItem("generated/operations/retry.d.mdt.ts");
    await commands.typegen({ cwd });
  }
});
