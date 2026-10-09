import { execFile } from "node:child_process";
import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const workspace = fileURLToPath(new URL("..", import.meta.url));
const root = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
  devDependencies?: { npm?: string };
};
const manifest = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
) as {
  name: string;
  repository?: string | { url?: string };
  scripts?: { prepack?: string; prepublishOnly?: string };
};
const repository =
  typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url;

if (!root.devDependencies?.npm) throw new Error("A locked npm 11.15+ tool dependency is required.");
if (manifest.name !== "markdown-template") throw new Error("Package name does not match setup.");
if (!repository?.includes("tyler-mitchell/markdown-template"))
  throw new Error("repository.url does not match setup.");
if (!manifest.scripts?.prepack) throw new Error("scripts.prepack is required.");

const directory = await mkdtemp(join(tmpdir(), "package-preflight-"));
const tarball = join(directory, "package.tgz");
try {
  if (manifest.scripts?.prepublishOnly) {
    await run("pnpm", ["--filter", manifest.name, "run", "prepublishOnly"], { cwd: workspace });
  }
  await run("pnpm", ["--filter", manifest.name, "pack", "--out", tarball], { cwd: workspace });
  await writeFile(
    join(directory, "package.json"),
    `${JSON.stringify({ name: "package-preflight", private: true, type: "module" })}\n`,
  );
  await run("npm", ["install", tarball, "--no-audit", "--no-fund"], { cwd: directory });
  await copyFile(new URL("./verify-published.mjs", import.meta.url), join(directory, "probe.mjs"));
  await run(process.execPath, ["probe.mjs"], { cwd: directory });
  await copyFile(new URL("../examples/templates/notice.mdt", import.meta.url), join(directory, "notice.mdt"));
  await copyFile(new URL("../examples/data/release.json", import.meta.url), join(directory, "release.json"));
  const executable = join(directory, "node_modules/.bin/markdown-template");
  await run(executable, ["typegen"], { cwd: directory });
  await run(executable, [
    "render", "notice.mdt", "--input", "release.json", "--output", "notice.actual.md",
  ], { cwd: directory });
  assert.equal(
    await readFile(join(directory, "notice.actual.md"), "utf8"),
    await readFile(new URL("../examples/output/notice.expected.md", import.meta.url), "utf8"),
  );
  await copyFile(
    new URL("./verify-published-types.ts", import.meta.url),
    join(directory, "types.ts"),
  );
  await writeFile(join(directory, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2023",
      module: "NodeNext",
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ["types.ts"],
  }));
  await run(join(workspace, "node_modules/.bin/tsc"), ["--project", directory], { cwd: directory });
} finally {
  await rm(directory, { recursive: true, force: true });
}
