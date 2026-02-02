# Example Lint Scripts

This directory contains example lint scripts that demonstrate how to write custom convention lints
for Viola.

## Available Examples

### no-console-log.sh

Detects `console.log` statements in production code (skips test files).

**Metadata:**

- ID: `no-console-log`
- Category: `correctness`
- Impact: `minor`
- Extensions: `.ts`, `.tsx`, `.js`, `.jsx`

**Example:**

```bash
chmod +x examples/no-console-log.sh
echo "src/utils.ts" | examples/no-console-log.sh
```

### no-fixme.sh

Finds FIXME comments that should be addressed before merging.

**Metadata:**

- ID: `no-fixme`
- Category: `consistency`
- Impact: `minor`
- Extensions: All files

**Example:**

```bash
chmod +x examples/no-fixme.sh
echo "src/component.ts" | examples/no-fixme.sh
```

### package-private.sh

Ensures package.json files have `"private": true` to prevent accidental publishing.

**Metadata:**

- ID: `package-private`
- Category: `correctness`
- Impact: `major`
- Extensions: `package.json`

**Example:**

```bash
chmod +x examples/package-private.sh
echo "package.json" | examples/package-private.sh
```

### file-naming.sh

Enforces kebab-case naming convention for all files.

**Metadata:**

- ID: `file-naming`
- Category: `consistency`
- Impact: `minor`
- Extensions: All files

**Example:**

```bash
chmod +x examples/file-naming.sh
echo "src/MyComponent.tsx" | examples/file-naming.sh
```

## Writing Your Own Scripts

### Basic Structure

```bash
#!/usr/bin/env bash
# @viola-lint
# @id my-custom-check
# @name My Custom Check
# @description What this script checks for
# @category consistency
# @impact minor
# @extensions .ts,.js

results="["
first=true

while IFS= read -r file; do
  # Your checking logic here
  
  if ! $first; then results+=","; fi
  first=false
  
  results+=$(jq -n \
    --arg kind "my-custom-check/issue-type" \
    --arg file "$file" \
    --argjson line 1 \
    --arg message "Issue description" \
    '{kind: $kind, file: $file, line: $line, message: $message}')
done

echo "${results}]"
```

### Script Protocol

**Input:** File paths on stdin, one per line

```
src/utils/helpers.ts
src/components/Button.tsx
```

**Output:** JSON array of issues on stdout

```json
[
  {
    "kind": "script-id/issue-type",
    "file": "src/utils/helpers.ts",
    "line": 42,
    "column": 10,
    "message": "Description of the issue",
    "confidence": 80,
    "suggestion": "How to fix it"
  }
]
```

**Exit Codes:**

- `0` - Success (may have found issues, but script ran correctly)
- `1` - Script error
- `2` - Configuration error

### Required Metadata

- `@viola-lint` - Marker identifying this as a Viola lint script (required)
- `@id` - Unique identifier (required)
- `@name` - Human-readable name (required)

### Optional Metadata

- `@description` - What the script checks
- `@category` - Issue category (`consistency`, `correctness`, `security`, `performance`)
- `@impact` - Issue severity (`minor`, `major`, `critical`)
- `@extensions` - Comma-separated file extensions to check (e.g., `.ts,.js`)

### Using jq for JSON Output

All examples use `jq` to construct valid JSON. This is the recommended approach:

```bash
results+=$(jq -n \
  --arg kind "my-check/issue" \
  --arg file "$file" \
  --argjson line "$line_num" \
  --arg message "Issue message" \
  '{kind: $kind, file: $file, line: $line, message: $message}')
```

### Tips

1. **Always output valid JSON** - Even if no issues are found, output `[]`
2. **Handle empty input** - Your script should handle receiving no files
3. **Skip irrelevant files** - Filter files by extension or pattern
4. **Use existing tools** - Leverage grep, awk, sed, jq, etc.
5. **Exit 0 on success** - Only use non-zero exit codes for script errors
6. **Avoid false positives** - Better to miss an issue than report incorrect ones

## Using Examples in Your Project

1. Copy the example scripts to your project's `lints/` directory:
   ```bash
   mkdir -p lints
   cp examples/no-console-log.sh lints/
   chmod +x lints/no-console-log.sh
   ```

2. Configure Viola to use script lints:
   ```typescript
   // viola.config.ts
   import { viola } from "@hiisi/viola";
   import scriptLints from "@hiisi/viola-script-lints";

   export default viola()
     .use(scriptLints()); // Discovers scripts from lints/
   ```

3. Run Viola:
   ```bash
   deno run -A jsr:@hiisi/viola-cli
   ```
