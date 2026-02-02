/**
 * Integration tests for the full plugin workflow.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import type { BaseLinter } from "@hiisi/viola/linters";
import { scriptLints } from "../src/plugin.ts";

Deno.test("scriptLints - creates plugin with default options", () => {
  const plugin = scriptLints();

  assertExists(plugin);
  assertEquals(plugin.name, "@hiisi/viola-script-lints");
  assertExists(plugin.linters);
});

Deno.test("scriptLints - creates plugin with custom options", () => {
  const plugin = scriptLints({
    directories: ["tests/fixtures"],
    timeout: 5000,
  });

  assertExists(plugin);
  assertEquals(plugin.name, "@hiisi/viola-script-lints");
});

Deno.test("scriptLints - discovers scripts from directory", async () => {
  const plugin = scriptLints({
    directories: ["tests/fixtures"],
  });

  assert(typeof plugin.linters === "function", "Linters should be a function");
  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();

  assert(linters.length > 0, "Should discover at least one script");

  // Check that valid scripts are discovered
  const linterIds = linters.map((l: BaseLinter) => l.meta.id);
  assert(linterIds.includes("valid-simple"), "Should discover valid-simple");
  assert(linterIds.includes("valid-metadata"), "Should discover valid-metadata");

  // Check that invalid scripts are not discovered
  assert(!linterIds.includes("invalid-no-marker"), "Should not discover invalid-no-marker");
});

Deno.test("scriptLints - discovers explicit scripts", async () => {
  const plugin = scriptLints({
    directories: [],
    scripts: ["tests/fixtures/valid-simple.sh"],
  });

  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();

  assertEquals(linters.length, 1);
  assertEquals(linters[0].meta.id, "valid-simple");
});

Deno.test("scriptLints - linter has correct metadata", async () => {
  const plugin = scriptLints({
    directories: ["tests/fixtures"],
  });

  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();
  const validMetadata = linters.find((l: BaseLinter) => l.meta.id === "valid-metadata");

  assertExists(validMetadata);
  assertEquals(validMetadata.meta.name, "Valid Metadata Script");
  assertEquals(validMetadata.meta.description, "A script with full metadata");
});

Deno.test("scriptLints - linter executes and returns issues", async () => {
  const plugin = scriptLints({
    directories: ["tests/fixtures"],
  });

  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();
  const simpleLinter = linters.find((l: BaseLinter) => l.meta.id === "valid-simple");

  assertExists(simpleLinter);

  // Create mock codebase data
  const mockData = {
    projectRoot: Deno.cwd(),
    files: [
      {
        path: "test-file.ts",
        extension: ".ts",
        lineCount: 10,
        functions: [],
        types: [],
        strings: [],
        exports: [],
        imports: [],
      },
    ],
    schemas: [],
    extractedAt: Date.now(),
    allFunctions: [],
    allTypes: [],
    allStrings: [],
    allExports: [],
    allImports: [],
  };

  const mockConfig = {
    enabled: true,
  };

  // Execute linter
  const issues = await simpleLinter.lint(mockData, mockConfig);

  assert(issues.length > 0, "Should return issues");
  assertEquals(issues[0].kind, "valid-simple/test-issue");
  assertEquals(issues[0].location.file, "test-file.ts");
});

Deno.test("scriptLints - filters files by extension", async () => {
  const plugin = scriptLints({
    directories: ["tests/fixtures"],
  });

  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();
  const metadataLinter = linters.find((l: BaseLinter) => l.meta.id === "valid-metadata");

  assertExists(metadataLinter);

  // Create mock data with .ts file (should match) and .py file (should not match)
  const mockData = {
    projectRoot: Deno.cwd(),
    files: [
      {
        path: "test.ts",
        extension: ".ts",
        lineCount: 10,
        functions: [],
        types: [],
        strings: [],
        exports: [],
        imports: [],
      },
      {
        path: "test.py",
        extension: ".py",
        lineCount: 10,
        functions: [],
        types: [],
        strings: [],
        exports: [],
        imports: [],
      },
    ],
    schemas: [],
    extractedAt: Date.now(),
    allFunctions: [],
    allTypes: [],
    allStrings: [],
    allExports: [],
    allImports: [],
  };

  const mockConfig = { enabled: true };
  const issues = await metadataLinter.lint(mockData, mockConfig);

  // Should only process .ts file (valid-metadata has extensions: .ts,.tsx,.js,.jsx)
  assertEquals(issues.length, 1);
  assertEquals(issues[0].location.file, "test.ts");
});

Deno.test("scriptLints - handles empty directories gracefully", async () => {
  const plugin = scriptLints({
    directories: ["nonexistent-directory"],
  });

  const linters = await (plugin.linters as () => Promise<BaseLinter[]>)();
  assertEquals(linters.length, 0);
});
