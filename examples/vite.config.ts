import { defineConfig } from "vite-plus";
import { markdownTemplate } from "markdown-template";

export default defineConfig({
  plugins: [markdownTemplate()],
});
