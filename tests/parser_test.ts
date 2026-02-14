/**
 * Tests for output parsing.
 */

import { assertEquals } from "@std/assert";
import { parseScriptOutput, parseScriptOutputSafe } from "../src/parser.ts";

Deno.test("parseScriptOutput - parses valid JSON array", () => {
  const stdout = JSON.stringify([
    {
      kind: "test-script/issue-1",
      file: "src/test.ts",
      line: 10,
      column: 5,
      message: "Test issue",
      confidence: 90,
      suggestion: "Fix it",
    },
  ]);

  const issues = parseScriptOutput(stdout, "test-script");

  assertEquals(issues.length, 1);
  assertEquals(issues[0].kind, "test-script/issue-1");
  assertEquals(issues[0].location.file, "src/test.ts");
  assertEquals(issues[0].location.line, 10);
  assertEquals(issues[0].location.column, 5);
  assertEquals(issues[0].message, "Test issue");
  assertEquals(issues[0].confidence, 90);
  assertEquals(issues[0].suggestion, "Fix it");
});

Deno.test("parseScriptOutput - handles minimal issue format", () => {
  const stdout = JSON.stringify([
    {
      kind: "test/issue",
      file: "file.ts",
      line: 1,
      message: "Issue",
    },
  ]);

  const issues = parseScriptOutput(stdout, "test");

  assertEquals(issues.length, 1);
  assertEquals(issues[0].kind, "test/issue");
  assertEquals(issues[0].location.column, 1); // Default column
  assertEquals(issues[0].confidence, 100); // Default confidence
});

Deno.test("parseScriptOutput - filters out invalid issues", () => {
  const stdout = JSON.stringify([
    {
      kind: "test/valid",
      file: "file.ts",
      line: 1,
      message: "Valid",
    },
    {
      kind: "test/invalid",
      // Missing file field
      line: 2,
      message: "Invalid",
    },
    {
      kind: "test/another-valid",
      file: "file2.ts",
      line: 3,
      message: "Another valid",
    },
  ]);

  const issues = parseScriptOutput(stdout, "test");

  assertEquals(issues.length, 2);
  assertEquals(issues[0].kind, "test/valid");
  assertEquals(issues[1].kind, "test/another-valid");
});

Deno.test("parseScriptOutput - handles multiple issues", () => {
  const stdout = JSON.stringify([
    {
      kind: "test/issue-1",
      file: "file1.ts",
      line: 1,
      message: "Issue 1",
    },
    {
      kind: "test/issue-2",
      file: "file2.ts",
      line: 2,
      message: "Issue 2",
    },
    {
      kind: "test/issue-3",
      file: "file3.ts",
      line: 3,
      message: "Issue 3",
    },
  ]);

  const issues = parseScriptOutput(stdout, "test");
  assertEquals(issues.length, 3);
});

Deno.test("parseScriptOutputSafe - handles errors gracefully", () => {
  const issues = parseScriptOutputSafe("invalid json", "stderr output", "test");
  assertEquals(issues.length, 0);
});

Deno.test("parseScriptOutputSafe - returns issues on success", () => {
  const stdout = JSON.stringify([
    {
      kind: "test/issue",
      file: "file.ts",
      line: 1,
      message: "Test",
    },
  ]);

  const issues = parseScriptOutputSafe(stdout, "", "test");
  assertEquals(issues.length, 1);
});
