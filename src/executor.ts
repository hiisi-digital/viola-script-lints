/**
 * Script execution logic.
 *
 * Executes scripts with stdin/stdout protocol and timeout enforcement.
 *
 * @module
 */

import type { ExecutionOptions, ScriptResult } from "./types.ts";

/**
 * Execute a script with file paths on stdin.
 *
 * Spawns the script process, writes file paths to stdin (one per line),
 * captures stdout/stderr, and enforces a timeout.
 *
 * @param scriptPath - Absolute path to the script
 * @param files - File paths to pass on stdin
 * @param options - Execution options
 * @returns Script result with exit code and output
 */
export async function executeScript(
  scriptPath: string,
  files: string[],
  options: ExecutionOptions,
): Promise<ScriptResult> {
  const abortController = new AbortController();
  let wasAborted = false;

  const command = new Deno.Command(scriptPath, {
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: options.cwd,
    env: options.env,
    signal: abortController.signal,
  });

  const process = command.spawn();

  // Write file paths to stdin
  const writer = process.stdin.getWriter();
  const encoder = new TextEncoder();
  try {
    const input = files.join("\n");
    if (input) {
      await writer.write(encoder.encode(input + "\n"));
    }
  } finally {
    await writer.close();
  }

  // Set up timeout
  const timeoutId = setTimeout(() => {
    wasAborted = true;
    abortController.abort();
  }, options.timeout);

  try {
    const { code, stdout, stderr } = await process.output();
    clearTimeout(timeoutId);

    // Check if process was killed due to timeout
    if (wasAborted) {
      throw new Error(`Script execution timed out after ${options.timeout}ms`);
    }

    const decoder = new TextDecoder();
    return {
      exitCode: code,
      stdout: decoder.decode(stdout),
      stderr: decoder.decode(stderr),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // If we aborted it, it's a timeout error
    if (wasAborted) {
      throw new Error(`Script execution timed out after ${options.timeout}ms`);
    }

    throw new Error(`Script execution failed: ${error}`);
  }
}

/**
 * Execute a script and handle timeouts gracefully.
 *
 * Returns null if script times out or fails to execute.
 *
 * @param scriptPath - Absolute path to the script
 * @param files - File paths to pass on stdin
 * @param options - Execution options
 * @returns Script result or null on failure
 */
export async function executeScriptSafe(
  scriptPath: string,
  files: string[],
  options: ExecutionOptions,
): Promise<ScriptResult | null> {
  try {
    return await executeScript(scriptPath, files, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      console.warn(`Script ${scriptPath} timed out after ${options.timeout}ms`);
    } else {
      console.warn(`Script ${scriptPath} failed: ${error}`);
    }
    return null;
  }
}
