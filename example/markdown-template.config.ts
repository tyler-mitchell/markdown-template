import { defineConfig } from "markdown-template";

export default defineConfig({
  include: ["templates/**/*.mdt"],
  render: [
    {
      file: "templates/notice.mdt",
      input: "data/release.json",
      output: "output/notice.actual.md",
    },
    {
      file: "templates/release-handoff.mdt",
      input: "data/release-handoff.json",
      output: "output/release-handoff.actual.md",
    },
  ],
});
