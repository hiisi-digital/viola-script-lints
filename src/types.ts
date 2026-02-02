/**
 * Type definitions for viola-script-lints.
 *
 * @module
 */

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Options for configuring the script lints plugin.
 */
export interface ScriptLintsOptions {
  /** Directories to search for scripts (default: ["lints"]) */
  directories?: string[];

  /** Explicit script paths to include */
  scripts?: string[];

  /** Timeout for script execution in ms (default: 30000) */
  timeout?: number;

  /** Environment variables to pass to scripts */
  env?: Record<string, string>;

  /** Working directory for scripts (default: project root) */
  cwd?: string;
}

// =============================================================================
// Script Metadata Types
// =============================================================================

/**
 * Metadata about a lint script.
 */
export interface ScriptMetadata {
  /** Unique identifier for the script */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what the script checks */
  description?: string;

  /** Issue category (consistency, correctness, security, performance) */
  category?: string;

  /** Issue impact (minor, major, critical) */
  impact?: string;

  /** File extensions to check (e.g., [".ts", ".tsx"]) */
  extensions?: string[];
}

// =============================================================================
// Script Issue Types
// =============================================================================

/**
 * An issue reported by a script (JSON output format).
 */
export interface ScriptIssue {
  /** Issue kind in format "script-id/issue-type" */
  kind: string;

  /** File path */
  file: string;

  /** Line number (1-based) */
  line: number;

  /** Column number (1-based, optional) */
  column?: number;

  /** Human-readable message */
  message: string;

  /** Confidence score 0-100 (optional, defaults to 100) */
  confidence?: number;

  /** Suggestion for fixing (optional) */
  suggestion?: string;
}

// =============================================================================
// Script Execution Types
// =============================================================================

/**
 * Result from executing a script.
 */
export interface ScriptResult {
  /** Exit code from the script */
  exitCode: number;

  /** Standard output (JSON issues) */
  stdout: string;

  /** Standard error (error messages) */
  stderr: string;
}

/**
 * Options for script execution.
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds */
  timeout: number;

  /** Working directory */
  cwd?: string;

  /** Environment variables */
  env?: Record<string, string>;
}

// =============================================================================
// Discovery Types
// =============================================================================

/**
 * A discovered script with its metadata.
 */
export interface DiscoveredScript {
  /** Absolute path to the script */
  path: string;

  /** Script metadata */
  metadata: ScriptMetadata;

  /** Whether the script is executable */
  isExecutable: boolean;
}
