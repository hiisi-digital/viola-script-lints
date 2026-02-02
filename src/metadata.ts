/**
 * Script metadata extraction.
 *
 * Extracts metadata from script header comments or companion .meta.json files.
 *
 * @module
 */

import type { ScriptMetadata } from "./types.ts";

/**
 * Parse metadata from script header comments.
 *
 * Looks for @viola-lint marker and metadata fields in the first 20 lines:
 * - @id - Unique identifier (required)
 * - @name - Human-readable name (required)
 * - @description - What the script checks
 * - @category - Issue category
 * - @impact - Issue severity
 * - @extensions - Comma-separated file extensions
 *
 * @param content - Script file content
 * @returns Metadata object or null if no @viola-lint marker found
 */
export function parseMetadataFromHeader(content: string): ScriptMetadata | null {
  const lines = content.split("\n").slice(0, 20);

  // Must have @viola-lint marker
  if (!lines.some((line) => line.includes("@viola-lint"))) {
    return null;
  }

  const metadata: Partial<ScriptMetadata> = {};

  for (const line of lines) {
    const idMatch = line.match(/@id\s+(\S+)/);
    if (idMatch) metadata.id = idMatch[1];

    const nameMatch = line.match(/@name\s+(.+)$/);
    if (nameMatch) metadata.name = nameMatch[1].trim();

    const descMatch = line.match(/@description\s+(.+)$/);
    if (descMatch) metadata.description = descMatch[1].trim();

    const catMatch = line.match(/@category\s+(\S+)/);
    if (catMatch) metadata.category = catMatch[1];

    const impactMatch = line.match(/@impact\s+(\S+)/);
    if (impactMatch) metadata.impact = impactMatch[1];

    const extMatch = line.match(/@extensions\s+(.+)$/);
    if (extMatch) {
      metadata.extensions = extMatch[1].split(",").map((e) => e.trim());
    }
  }

  // id and name are required
  if (!metadata.id || !metadata.name) {
    return null;
  }

  return metadata as ScriptMetadata;
}

/**
 * Load metadata from a companion .meta.json file.
 *
 * @param jsonPath - Path to the .meta.json file
 * @returns Metadata object or null if file doesn't exist or is invalid
 */
export async function loadMetadataFromJson(
  jsonPath: string,
): Promise<ScriptMetadata | null> {
  try {
    const content = await Deno.readTextFile(jsonPath);
    const data = JSON.parse(content);

    // Validate required fields
    if (!data.id || !data.name) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      impact: data.impact,
      extensions: data.extensions,
    };
  } catch {
    return null;
  }
}

/**
 * Extract metadata from a script file.
 *
 * First tries to parse from header comments, then falls back to
 * companion .meta.json file.
 *
 * @param scriptPath - Path to the script file
 * @returns Metadata object or null if not found
 */
export async function extractMetadata(
  scriptPath: string,
): Promise<ScriptMetadata | null> {
  try {
    // Try header comments first
    const content = await Deno.readTextFile(scriptPath);
    const headerMetadata = parseMetadataFromHeader(content);
    if (headerMetadata) {
      return headerMetadata;
    }

    // Try companion .meta.json file
    const jsonPath = `${scriptPath}.meta.json`;
    const jsonMetadata = await loadMetadataFromJson(jsonPath);
    if (jsonMetadata) {
      return jsonMetadata;
    }

    return null;
  } catch {
    return null;
  }
}
