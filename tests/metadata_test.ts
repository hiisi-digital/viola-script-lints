/**
 * Tests for metadata extraction.
 */

import { assertEquals, assertExists } from "@std/assert";
import { extractMetadata, loadMetadataFromJson, parseMetadataFromHeader } from "../src/metadata.ts";

Deno.test("parseMetadataFromHeader - extracts id and name", () => {
  const content = `#!/usr/bin/env bash
# @viola-lint
# @id test-script
# @name Test Script
`;

  const meta = parseMetadataFromHeader(content);
  assertExists(meta);
  assertEquals(meta.id, "test-script");
  assertEquals(meta.name, "Test Script");
});

Deno.test("parseMetadataFromHeader - extracts full metadata", () => {
  const content = `#!/usr/bin/env bash
# @viola-lint
# @id full-test
# @name Full Test
# @description This is a test
# @category consistency
# @impact minor
# @extensions .ts,.js
`;

  const meta = parseMetadataFromHeader(content);
  assertExists(meta);
  assertEquals(meta.id, "full-test");
  assertEquals(meta.name, "Full Test");
  assertEquals(meta.description, "This is a test");
  assertEquals(meta.category, "consistency");
  assertEquals(meta.impact, "minor");
  assertEquals(meta.extensions, [".ts", ".js"]);
});

Deno.test("parseMetadataFromHeader - returns null without @viola-lint marker", () => {
  const content = `#!/usr/bin/env bash
# @id test
# @name Test
`;

  const meta = parseMetadataFromHeader(content);
  assertEquals(meta, null);
});

Deno.test("parseMetadataFromHeader - returns null without required fields", () => {
  const content = `#!/usr/bin/env bash
# @viola-lint
# @name Test
`;

  const meta = parseMetadataFromHeader(content);
  assertEquals(meta, null);
});

Deno.test("loadMetadataFromJson - loads valid JSON", async () => {
  const jsonPath = "tests/fixtures/json-metadata-script.sh.meta.json";
  const meta = await loadMetadataFromJson(jsonPath);

  assertExists(meta);
  assertEquals(meta.id, "json-metadata");
  assertEquals(meta.name, "JSON Metadata Script");
  assertEquals(meta.description, "Script with JSON metadata");
  assertEquals(meta.category, "correctness");
  assertEquals(meta.impact, "major");
  assertEquals(meta.extensions, [".json", ".yaml"]);
});

Deno.test("loadMetadataFromJson - returns null for missing file", async () => {
  const meta = await loadMetadataFromJson("nonexistent.json");
  assertEquals(meta, null);
});

Deno.test("extractMetadata - extracts from header", async () => {
  const meta = await extractMetadata("tests/fixtures/valid-simple.sh");

  assertExists(meta);
  assertEquals(meta.id, "valid-simple");
  assertEquals(meta.name, "Valid Simple Script");
});

Deno.test("extractMetadata - extracts from JSON file", async () => {
  const meta = await extractMetadata("tests/fixtures/json-metadata-script.sh");

  assertExists(meta);
  assertEquals(meta.id, "json-metadata");
  assertEquals(meta.name, "JSON Metadata Script");
});

Deno.test("extractMetadata - returns null for invalid script", async () => {
  const meta = await extractMetadata("tests/fixtures/invalid-no-marker.sh");
  assertEquals(meta, null);
});
