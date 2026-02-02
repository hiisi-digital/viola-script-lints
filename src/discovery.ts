/**
 * Script discovery logic.
 *
 * Discovers lint scripts from configured directories and explicit paths.
 *
 * @module
 */

import { join } from "@std/path";
import { walk } from "@std/fs";
import type { DiscoveredScript } from "./types.ts";
import { extractMetadata } from "./metadata.ts";

/**
 * Supported script extensions.
 */
const SCRIPT_EXTENSIONS = [".sh", ".bash", ".py", ".rb", ".pl", ""];

/**
 * Check if a file is executable.
 *
 * @param path - File path
 * @returns True if executable
 */
async function isExecutable(path: string): Promise<boolean> {
  try {
    const info = await Deno.stat(path);
    // Check if file has execute permission for owner, group, or others
    // Mode bits: owner (rwx), group (rwx), others (rwx)
    // Execute bits are: 0o100 (owner), 0o010 (group), 0o001 (others)
    return info.mode !== null && (info.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

/**
 * Check if a file has a supported script extension.
 *
 * @param path - File path
 * @returns True if extension is supported
 */
function hasSupportedExtension(path: string): boolean {
  return SCRIPT_EXTENSIONS.some((ext) => {
    if (ext === "") {
      // For extensionless files, check if name doesn't contain a dot (except hidden files)
      const basename = path.split("/").pop() || "";
      return !basename.includes(".") || basename.startsWith(".");
    }
    return path.endsWith(ext);
  });
}

/**
 * Discover scripts in a single directory.
 *
 * @param dirPath - Directory path (absolute or relative)
 * @param rootDir - Root directory for resolving relative paths
 * @returns Array of discovered scripts
 */
export async function discoverScriptsInDirectory(
  dirPath: string,
  rootDir: string,
): Promise<DiscoveredScript[]> {
  const absolutePath = dirPath.startsWith("/") ? dirPath : join(rootDir, dirPath);

  try {
    // Check if directory exists
    const stat = await Deno.stat(absolutePath);
    if (!stat.isDirectory) {
      return [];
    }
  } catch {
    // Directory doesn't exist, skip silently
    return [];
  }

  const scripts: DiscoveredScript[] = [];

  try {
    for await (const entry of walk(absolutePath, { includeDirs: false })) {
      // Skip non-files
      if (!entry.isFile) continue;

      // Check extension
      if (!hasSupportedExtension(entry.path)) continue;

      // Check if executable
      const executable = await isExecutable(entry.path);
      if (!executable) {
        continue;
      }

      // Extract metadata
      const metadata = await extractMetadata(entry.path);
      if (!metadata) {
        continue;
      }

      scripts.push({
        path: entry.path,
        metadata,
        isExecutable: true,
      });
    }
  } catch (error) {
    console.warn(`Warning: Failed to scan directory ${absolutePath}: ${error}`);
  }

  return scripts;
}

/**
 * Discover a script from an explicit path.
 *
 * @param scriptPath - Script path (absolute or relative)
 * @param rootDir - Root directory for resolving relative paths
 * @returns Discovered script or null if invalid
 */
export async function discoverScript(
  scriptPath: string,
  rootDir: string,
): Promise<DiscoveredScript | null> {
  const absolutePath = scriptPath.startsWith("/") ? scriptPath : join(rootDir, scriptPath);

  try {
    // Check if file exists
    const stat = await Deno.stat(absolutePath);
    if (!stat.isFile) {
      console.warn(`Warning: ${absolutePath} is not a file`);
      return null;
    }

    // Check if executable
    const executable = await isExecutable(absolutePath);
    if (!executable) {
      console.warn(`Warning: ${absolutePath} is not executable (chmod +x)`);
      return null;
    }

    // Extract metadata
    const metadata = await extractMetadata(absolutePath);
    if (!metadata) {
      console.warn(`Warning: ${absolutePath} is missing @viola-lint marker or valid metadata`);
      return null;
    }

    return {
      path: absolutePath,
      metadata,
      isExecutable: true,
    };
  } catch (error) {
    console.warn(`Warning: Failed to load script ${absolutePath}: ${error}`);
    return null;
  }
}

/**
 * Discover all scripts from configured directories and explicit paths.
 *
 * @param directories - Directories to scan
 * @param explicitPaths - Explicit script paths
 * @param rootDir - Root directory for resolving relative paths
 * @returns Array of discovered scripts (deduplicated by path)
 */
export async function discoverScripts(
  directories: string[],
  explicitPaths: string[],
  rootDir: string,
): Promise<DiscoveredScript[]> {
  const scriptsMap = new Map<string, DiscoveredScript>();

  // Discover from directories
  for (const dir of directories) {
    const scripts = await discoverScriptsInDirectory(dir, rootDir);
    for (const script of scripts) {
      scriptsMap.set(script.path, script);
    }
  }

  // Discover from explicit paths
  for (const path of explicitPaths) {
    const script = await discoverScript(path, rootDir);
    if (script) {
      scriptsMap.set(script.path, script);
    }
  }

  return Array.from(scriptsMap.values());
}
