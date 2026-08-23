/**
 * Viola plugin implementation for script lints.
 *
 * @module
 */

import type { BaseLinter } from "@hiisi/viola/linters";
import type { ScriptLintsOptions, ViolaPlugin } from "./types.ts";
import { discoverScripts } from "./discovery.ts";
import { ScriptLinter } from "./linter.ts";

/**
 * Default options for script lints.
 */
const DEFAULT_OPTIONS: ScriptLintsOptions = {
  directories: ["lints"],
  scripts: [],
  timeout: 30000,
};

/**
 * Create the script lints plugin.
 *
 * Discovers scripts from configured directories and explicit paths,
 * then creates a ScriptLinter for each discovered script.
 *
 * @param options - Plugin configuration options
 * @returns Viola plugin
 */
export function scriptLints(options: ScriptLintsOptions = {}): ViolaPlugin {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return {
    name: "@hiisi/viola-script-lints",

    linters: async (): Promise<BaseLinter[]> => {
      const rootDir = config.cwd ?? Deno.cwd();
      const directories = config.directories ?? DEFAULT_OPTIONS.directories!;
      const scripts = config.scripts ?? DEFAULT_OPTIONS.scripts!;

      const discovered = await discoverScripts(directories, scripts, rootDir);

      if (discovered.length === 0) {
        console.warn(
          "No lint scripts found. Create executable scripts in lints/ directory or specify paths.",
        );
        return [];
      }

      // TypeScript will show an error about ScriptLinter[] not being assignable
      // to BaseLinter[] due to the async methods, but this works at runtime because
      // Viola's runLinters() wraps linter.run() calls with Promise.resolve()
      // @ts-expect-error - Async linters work with Viola's Promise.resolve() wrapper
      return discovered.map(
        (script) =>
          new ScriptLinter(script, {
            timeout: config.timeout,
            cwd: config.cwd,
            env: config.env,
          }),
      );
    },
  };
}

/**
 * Default export - plugin factory function.
 */
export default scriptLints;
