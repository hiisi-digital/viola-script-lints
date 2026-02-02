/**
 * Tests for script execution.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { executeScript, executeScriptSafe } from "../src/executor.ts";

Deno.test("executeScript - runs script with stdin input", async () => {
  const result = await executeScript(
    "tests/fixtures/valid-simple.sh",
    ["file1.ts", "file2.ts"],
    { timeout: 5000 },
  );

  assertEquals(result.exitCode, 0);
  assert(result.stdout.length > 0, "Should have stdout");
  assert(result.stdout.includes("file1.ts"), "Should include file1.ts in output");
});

Deno.test("executeScript - captures stderr", async () => {
  // Create a temporary script that writes to stderr
  const tempScript = await Deno.makeTempFile({ suffix: ".sh" });
  await Deno.writeTextFile(
    tempScript,
    `#!/usr/bin/env bash
echo "error message" >&2
echo "[]"
`,
  );
  await Deno.chmod(tempScript, 0o755);

  try {
    const result = await executeScript(tempScript, [], { timeout: 5000 });
    assertEquals(result.exitCode, 0);
    assert(result.stderr.includes("error message"), "Should capture stderr");
  } finally {
    await Deno.remove(tempScript);
  }
});

Deno.test("executeScript - handles non-zero exit code", async () => {
  // Create a temporary script that exits with error
  const tempScript = await Deno.makeTempFile({ suffix: ".sh" });
  await Deno.writeTextFile(
    tempScript,
    `#!/usr/bin/env bash
exit 1
`,
  );
  await Deno.chmod(tempScript, 0o755);

  try {
    const result = await executeScript(tempScript, [], { timeout: 5000 });
    assertEquals(result.exitCode, 1);
  } finally {
    await Deno.remove(tempScript);
  }
});

Deno.test("executeScript - enforces timeout", async () => {
  const result = await executeScriptSafe(
    "tests/fixtures/timeout-script.sh",
    [],
    { timeout: 100 }, // Very short timeout
  );

  // Should return null on timeout
  assertEquals(result, null);
});

Deno.test("executeScriptSafe - returns null on failure", async () => {
  const result = await executeScriptSafe(
    "nonexistent-script.sh",
    [],
    { timeout: 5000 },
  );

  assertEquals(result, null);
});

Deno.test("executeScript - passes environment variables", async () => {
  // Create a temporary script that uses env vars
  const tempScript = await Deno.makeTempFile({ suffix: ".sh" });
  await Deno.writeTextFile(
    tempScript,
    `#!/usr/bin/env bash
echo "TEST_VAR=$TEST_VAR"
echo "[]"
`,
  );
  await Deno.chmod(tempScript, 0o755);

  try {
    const result = await executeScript(tempScript, [], {
      timeout: 5000,
      env: { TEST_VAR: "test-value" },
    });

    assertEquals(result.exitCode, 0);
    assert(result.stdout.includes("TEST_VAR=test-value"), "Should pass env var");
  } finally {
    await Deno.remove(tempScript);
  }
});

Deno.test("executeScript - handles empty file list", async () => {
  const result = await executeScript(
    "tests/fixtures/valid-simple.sh",
    [],
    { timeout: 5000 },
  );

  assertEquals(result.exitCode, 0);
  assertExists(result.stdout);
});
