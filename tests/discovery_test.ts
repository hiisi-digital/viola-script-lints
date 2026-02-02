/**
 * Tests for script discovery.
 */

import { assert, assertEquals } from "@std/assert";
import { discoverScript, discoverScripts, discoverScriptsInDirectory } from "../src/discovery.ts";

Deno.test("discoverScriptsInDirectory - finds executable scripts with metadata", async () => {
  const scripts = await discoverScriptsInDirectory("tests/fixtures", Deno.cwd());

  // Should find valid-simple.sh, valid-metadata.sh, json-metadata-script.sh, etc.
  // But NOT invalid-no-marker.sh or not-executable.sh
  assert(scripts.length > 0, "Should find at least one script");

  const ids = scripts.map((s) => s.metadata.id);
  assert(ids.includes("valid-simple"), "Should find valid-simple");
  assert(ids.includes("valid-metadata"), "Should find valid-metadata");
  assert(!ids.includes("invalid-no-marker"), "Should not find invalid-no-marker");
});

Deno.test("discoverScriptsInDirectory - returns empty array for nonexistent directory", async () => {
  const scripts = await discoverScriptsInDirectory("nonexistent", Deno.cwd());
  assertEquals(scripts.length, 0);
});

Deno.test("discoverScript - discovers valid script", async () => {
  const script = await discoverScript("tests/fixtures/valid-simple.sh", Deno.cwd());

  assert(script !== null, "Should discover script");
  assertEquals(script!.metadata.id, "valid-simple");
  assertEquals(script!.metadata.name, "Valid Simple Script");
  assert(script!.isExecutable, "Should be executable");
});

Deno.test("discoverScript - returns null for non-executable script", async () => {
  const script = await discoverScript("tests/fixtures/not-executable.sh", Deno.cwd());
  assertEquals(script, null);
});

Deno.test("discoverScript - returns null for script without metadata", async () => {
  const script = await discoverScript("tests/fixtures/invalid-no-marker.sh", Deno.cwd());
  assertEquals(script, null);
});

Deno.test("discoverScript - returns null for nonexistent script", async () => {
  const script = await discoverScript("nonexistent.sh", Deno.cwd());
  assertEquals(script, null);
});

Deno.test("discoverScripts - combines directory and explicit paths", async () => {
  const scripts = await discoverScripts(
    ["tests/fixtures"],
    ["tests/fixtures/valid-simple.sh"],
    Deno.cwd(),
  );

  // Should find all scripts in directory plus explicit path (deduplicated)
  assert(scripts.length > 0, "Should find scripts");

  const ids = scripts.map((s) => s.metadata.id);
  assert(ids.includes("valid-simple"), "Should include valid-simple");
  assert(ids.includes("valid-metadata"), "Should include valid-metadata");

  // Check deduplication - valid-simple should only appear once
  const validSimpleCount = ids.filter((id) => id === "valid-simple").length;
  assertEquals(validSimpleCount, 1, "Should deduplicate scripts");
});

Deno.test("discoverScripts - handles empty directories", async () => {
  const scripts = await discoverScripts([], [], Deno.cwd());
  assertEquals(scripts.length, 0);
});
