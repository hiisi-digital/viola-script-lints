/**
 * Script output parsing and validation.
 *
 * Parses JSON output from scripts and validates issue structure.
 *
 * @module
 */

import type { Issue } from "@hiisi/viola";
import type { ScriptIssue } from "./types.ts";

/**
 * Check if an object is a valid ScriptIssue.
 *
 * @param obj - Object to validate
 * @returns True if valid ScriptIssue
 */
function isValidScriptIssue(obj: unknown): obj is ScriptIssue {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.kind === "string" &&
    typeof o.file === "string" &&
    typeof o.line === "number" &&
    typeof o.message === "string"
  );
}

/**
 * Parse script output and convert to Viola issues.
 *
 * Parses JSON array from stdout, validates structure, and converts
 * to Viola Issue format.
 *
 * @param stdout - Script stdout content
 * @param scriptId - Script ID for logging
 * @returns Array of Viola issues
 */
export function parseScriptOutput(stdout: string, scriptId: string): Issue[] {
  if (!stdout.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    console.warn(
      `Script ${scriptId} produced invalid JSON output: ${error}`,
    );
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn(`Script ${scriptId} output is not an array`);
    return [];
  }

  const issues: Issue[] = [];

  for (const item of parsed) {
    if (!isValidScriptIssue(item)) {
      console.warn(
        `Script ${scriptId} produced invalid issue format:`,
        JSON.stringify(item).slice(0, 100),
      );
      continue;
    }

    issues.push({
      kind: item.kind,
      location: {
        file: item.file,
        line: item.line,
        column: item.column ?? 1,
      },
      message: item.message,
      confidence: item.confidence ?? 100,
      suggestion: item.suggestion,
    });
  }

  return issues;
}

/**
 * Parse script output with error handling.
 *
 * Returns empty array on parse errors instead of throwing.
 *
 * @param stdout - Script stdout content
 * @param stderr - Script stderr content (for logging)
 * @param scriptId - Script ID for logging
 * @returns Array of Viola issues (empty on error)
 */
export function parseScriptOutputSafe(
  stdout: string,
  stderr: string,
  scriptId: string,
): Issue[] {
  try {
    const issues = parseScriptOutput(stdout, scriptId);

    // Log stderr if present (even on success)
    if (stderr.trim()) {
      console.warn(`Script ${scriptId} stderr:`, stderr.trim());
    }

    return issues;
  } catch (error) {
    console.error(`Failed to parse output from script ${scriptId}: ${error}`);
    return [];
  }
}
