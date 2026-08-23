/**
 * @module
 * Shell script runner plugin for the Viola convention linter.
 *
 * This plugin enables running arbitrary shell scripts as custom convention lints.
 * Scripts receive file paths on stdin and output JSON issues to stdout.
 *
 * @example
 * ```ts
 * import { viola } from "@hiisi/viola";
 * import scriptLints from "@hiisi/viola-script-lints";
 *
 * export default viola()
 *   .use(scriptLints());  // Discovers scripts from lints/
 * ```
 *
 * @example
 * ```ts
 * // With custom configuration
 * export default viola()
 *   .use(scriptLints({
 *     directories: ["lints", "custom-checks"],
 *     timeout: 60000,
 *   }));
 * ```
 */

// Re-export types for script authors
export type {
  ScriptIssue,
  ScriptLintsOptions,
  ScriptMetadata,
  ScriptResult,
  ViolaPlugin,
} from "./src/types.ts";

// Re-export plugin factory
export { scriptLints, scriptLints as default } from "./src/plugin.ts";
