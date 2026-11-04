import { createServer } from "vite-plus";
import { expect, test } from "vite-plus/test";
import { getPath } from "package-management";
import { markdownTemplate } from "../src/index.ts";

test("compiles Vite document imports while leaving raw imports to Vite", async () => {
  const server = await createServer({
    configFile: false,
    root: getPath(["<cwd>", "test/fixtures/workflow-documentation"]),
    plugins: [markdownTemplate()],
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  try {
    const document = await server.transformRequest("/template.mdt?import");
    expect(document?.code).toContain("export default compile(");
    expect(document?.code).toContain("deploy.yml?import&raw");
    expect(document?.code).toContain("notice.mdt?import");
    const raw = await server.transformRequest("/notice.mdt?raw");
    expect(raw?.code).toContain("deploys from the reviewed commit.");
    expect(raw?.code).not.toContain("export default compile(");
  } finally {
    await server.close();
  }
});
