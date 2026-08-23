/**
 * ScriptLinter - Wraps a script as a BaseLinter.
 *
 * @module
 */

import { BaseLinter, type LinterDataRequirements, type LinterMeta } from "@hiisi/viola/linters";
import type { CodebaseData, Issue, IssueCatalog, LinterConfig, LinterResult } from "@hiisi/viola";
import type { DiscoveredScript, ExecutionOptions } from "./types.ts";
import { executeScriptSafe } from "./executor.ts";
import { parseScriptOutputSafe } from "./parser.ts";

/**
 * ScriptLinter wraps a shell script as a Viola linter.
 *
 * Each script becomes a separate linter instance.
 */
export class ScriptLinter extends BaseLinter {
  private script: DiscoveredScript;
  private timeout: number;
  private cwd?: string;
  private env?: Record<string, string>;

  constructor(
    script: DiscoveredScript,
    options: {
      timeout?: number;
      cwd?: string;
      env?: Record<string, string>;
    } = {},
  ) {
    super();
    this.script = script;
    this.timeout = options.timeout ?? 30000;
    this.cwd = options.cwd;
    this.env = options.env;
  }

  get meta(): LinterMeta {
    return {
      id: this.script.metadata.id,
      name: this.script.metadata.name,
      description: this.script.metadata.description ?? "",
    };
  }

  get catalog(): IssueCatalog {
    // Scripts define their own issue kinds dynamically
    // We can't know all possible issue kinds ahead of time
    // Return an empty catalog - issues will still be reported
    return {};
  }

  get requirements(): LinterDataRequirements {
    // Scripts work with file paths, so we need basic file info
    return {
      files: true,
    };
  }

  /**
   * Override run() to support async lint execution.
   *
   * Note: TypeScript will show an error here because the base class expects
   * a synchronous method, but Viola's runLinters() wraps calls with Promise.resolve(),
   * so async methods work correctly in practice.
   */
  override async run(data: CodebaseData, config: LinterConfig): Promise<LinterResult> {
    const startTime = performance.now();

    try {
      const issues = await this.lint(data, config);
      const durationMs = performance.now() - startTime;

      return {
        linter: this.meta.id,
        issues,
        durationMs,
        success: true,
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        linter: this.meta.id,
        issues: [],
        durationMs,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Lint implementation that executes the script.
   *
   * Note: This is async and called only from our overridden async run() method.
   * The base BaseLinter.lint() is sync, but we override run() to handle async.
   */
  override async lint(data: CodebaseData, _config: LinterConfig): Promise<Issue[]> {
    // Filter files by extensions if specified
    let files = data.files.map((f) => f.path);
    if (this.script.metadata.extensions?.length) {
      files = files.filter((f) => this.script.metadata.extensions!.some((ext) => f.endsWith(ext)));
    }

    if (files.length === 0) {
      return [];
    }

    const options: ExecutionOptions = {
      timeout: this.timeout,
      cwd: this.cwd ?? data.projectRoot,
      env: this.env,
    };

    const result = await executeScriptSafe(this.script.path, files, options);

    if (!result) {
      // Script failed or timed out
      return [];
    }

    if (result.exitCode !== 0) {
      console.warn(
        `Script ${this.script.metadata.id} exited with code ${result.exitCode}`,
      );
      if (result.stderr) {
        console.warn(`stderr: ${result.stderr}`);
      }
      return [];
    }

    return parseScriptOutputSafe(
      result.stdout,
      result.stderr,
      this.script.metadata.id,
    );
  }
}
