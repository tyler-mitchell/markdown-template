import { createDefineConfig, loadConfig } from "c12";
import { getPath } from "package-management";
import { glob } from "tinyglobby";
import type { Values } from "../core/types.ts";

export interface RenderConfig {
  file: string;
  /** JSON file or render arguments; paths are relative to the configuration. */
  input?: string | Values;
  output: string;
}

export interface Config {
  /** Document paths or globs, relative to the configuration. */
  include?: string[];
  exclude?: string[];
  /** Omit outDir to generate declarations beside their documents. */
  types?: { outDir?: string };
  render?: RenderConfig[];
}

/** Defines configuration for document discovery, rendering, and declarations. */
export const defineConfig = createDefineConfig<Config>();

export async function loadProject(options: { cwd?: string; config?: string } = {}): Promise<{
  config: Config;
  cwd: string;
  files: string[];
}> {
  const resolved = await loadConfig<Config>({
    name: "markdown-template",
    cwd: options.cwd,
    configFile: options.config,
    configFileRequired: options.config !== undefined,
    rcFile: false,
    globalRc: false,
    packageJson: false,
  });
  const cwd = resolved._configFile
    ? getPath({ to: "<current_folder>", from: resolved._configFile })
    : resolved.cwd!;
  const files = await glob(resolved.config.include ?? ["**/*.mdt"], {
    cwd,
    ignore: ["**/node_modules/**", "**/dist/**", ...(resolved.config.exclude ?? [])],
  });
  return {
    config: resolved.config,
    cwd,
    files: files.filter((file) => file.endsWith(".mdt")).sort(),
  };
}
