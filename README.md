# `viola-script-lints`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/viola-script-lints)](https://jsr.io/@hiisi/viola-script-lints)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/viola-script-lints.svg)](https://github.com/hiisi-digital/viola-script-lints/issues)
![License](https://img.shields.io/github/license/hiisi-digital/viola-script-lints?color=%23009689)

> Run shell scripts as custom lints for Viola.

</div>

## What is this?

`viola-script-lints` is a plugin for [Viola](https://github.com/hiisi-digital/viola) that enables
running arbitrary shell scripts as custom convention lints. Write lints in bash, python, or any
scripting language. No TypeScript required.

### Why Scripts?

- **Low barrier to entry**. Anyone who can write bash can write a lint.
- **Language agnostic**. Scripts can be bash, python, perl, whatever.
- **Project-specific**. Keep custom lints in your repo, not a separate package.
- **Rapid iteration**. No compile step, just edit and run.
- **Existing tools**. Use grep, awk, jq, ripgrep, etc.

## Installation

```bash
deno add jsr:@hiisi/viola-script-lints
```

## Quick Start

### 1. Create a lint script

Create a `lints/` directory in your project and add a script:

```bash
#!/usr/bin/env bash
# @viola-lint
# @id no-console-log
# @name No Console Log
# @description Disallow console.log in production code
# @category correctness
# @impact minor
# @extensions .ts,.tsx,.js,.jsx

results="["
first=true

while IFS= read -r file; do
  # Skip test files
  [[ "$file" == *_test.* ]] && continue
  [[ "$file" == *.test.* ]] && continue
  
  while IFS=: read -r line_num line_content; do
    if ! $first; then results+=","; fi
    first=false
    
    results+=$(jq -n \
      --arg kind "no-console-log/found" \
      --arg file "$file" \
      --argjson line "$line_num" \
      --arg message "console.log found - remove before production" \
      '{kind: $kind, file: $file, line: $line, message: $message}')
  done < <(grep -n "console\.log" "$file" 2>/dev/null || true)
done

echo "${results}]"
```

Make it executable:

```bash
chmod +x lints/no-console-log.sh
```

### 2. Configure Viola

```ts
// viola.config.ts
import { viola } from "@hiisi/viola";
import scriptLints from "@hiisi/viola-script-lints";

export default viola()
  .use(scriptLints()); // Discovers scripts from lints/
```

This call does not work against `@hiisi/viola` 0.3.0. `use()` accepts a plugin object carrying a
`build(viola)` method, or a plugin function; `scriptLints()` returns `{ name, linters }` instead, so
the call throws `Invalid plugin: expected an object with build() method or a function`. Loading the
package through a plugin specifier instead is accepted and discovers zero linters, because the
loader looks for an array of linter instances and this module exports a factory function. There is
currently no working route from a viola config to these scripts.

### 3. Run

```bash
deno run -A jsr:@hiisi/viola-cli
```

## Script Protocol

Scripts communicate with Viola through a simple stdin/stdout protocol.

### Input

File paths are passed on stdin, one per line:

```
src/utils/helpers.ts
src/components/Button.tsx
src/types/user.ts
```

### Output

Scripts output a JSON array of issues to stdout:

```json
[
  {
    "kind": "my-script/some-issue",
    "file": "src/utils/helpers.ts",
    "line": 42,
    "column": 10,
    "message": "Found a problem here",
    "confidence": 80,
    "suggestion": "Try doing X instead"
  }
]
```

### Exit Codes

- `0`. Success (may have found issues, but the script ran correctly).
- Any non-zero code. Script failure (invalid input, crash, etc.). The plugin logs a warning and
  discards the run's output. It does not distinguish one non-zero code from another.

## Script Metadata

Scripts declare metadata via header comments:

```bash
#!/usr/bin/env bash
# @viola-lint
# @id my-custom-check
# @name My Custom Check
# @description Checks for my team's specific conventions
# @category consistency
# @impact minor
# @extensions .ts,.tsx,.js,.jsx
```

Or via a companion `.meta.json` file, named by appending `.meta.json` to the full script filename
(`my-custom-check.sh.meta.json` next to `my-custom-check.sh`):

```json
{
  "id": "my-custom-check",
  "name": "My Custom Check",
  "description": "Checks for my team's specific conventions",
  "category": "consistency",
  "impact": "minor",
  "extensions": [".ts", ".tsx", ".js", ".jsx"]
}
```

### Required Fields

- `@viola-lint`. Marker identifying this as a Viola lint script.
- `@id`. Unique identifier for the linter.
- `@name`. Human-readable name.

### Optional Fields

- `@description`. What the script checks. Surfaces as the linter's description.
- `@category`. Issue category. Parsed and stored, then unused.
- `@impact`. Issue severity. Parsed and stored, then unused.
- `@extensions`. Comma-separated file extensions to check.

`@category` and `@impact` reach `ScriptMetadata` and stop there. A `ScriptLinter` reports an empty
issue catalog, and Viola resolves an issue's category and impact from the reporting linter's catalog,
so a rule written with `when.category` or `when.impact` never matches a script-reported issue.

## Configuration

```ts
import scriptLints from "@hiisi/viola-script-lints";

viola().use(scriptLints({
  // Directories to search for scripts (default: ["lints"])
  directories: ["lints", "custom-checks"],

  // Explicit script paths to include
  scripts: ["scripts/special-check.sh"],

  // Timeout for script execution in ms (default: 30000)
  timeout: 60000,

  // Environment variables to pass to scripts
  env: {
    MY_VAR: "value",
  },

  // Working directory for scripts (default: project root)
  cwd: ".",
}));
```

## Example Scripts

### grep-based check (bash)

```bash
#!/usr/bin/env bash
# @viola-lint
# @id no-fixme
# @name No FIXME Comments
# @description Find FIXME comments that should be addressed
# @category consistency
# @impact minor

results="["
first=true

while IFS= read -r file; do
  while IFS=: read -r line_num _; do
    if ! $first; then results+=","; fi
    first=false
    
    results+=$(jq -n \
      --arg kind "no-fixme/found" \
      --arg file "$file" \
      --argjson line "$line_num" \
      --arg message "FIXME comment found - address before merging" \
      '{kind: $kind, file: $file, line: $line, message: $message}')
  done < <(grep -n "FIXME" "$file" 2>/dev/null || true)
done

echo "${results}]"
```

### jq-based JSON check (bash)

```bash
#!/usr/bin/env bash
# @viola-lint
# @id package-private
# @name Package.json Private Field
# @description Ensure package.json has private: true
# @extensions package.json

results="["

while IFS= read -r file; do
  [[ "$(basename "$file")" != "package.json" ]] && continue
  
  private=$(jq -r '.private // false' "$file" 2>/dev/null)
  
  if [[ "$private" != "true" ]]; then
    results+=$(jq -n \
      --arg file "$file" \
      '{kind: "package-private/missing", file: $file, line: 1, message: "package.json should have private: true"}')
  fi
done

echo "${results}]"
```

### Python script

```python
#!/usr/bin/env python3
# @viola-lint
# @id python-check
# @name Python Check
# @description Example Python lint script
# @extensions .py

import sys
import json
import re

issues = []

for line in sys.stdin:
    filepath = line.strip()
    if not filepath:
        continue
    
    with open(filepath, 'r') as f:
        for line_num, content in enumerate(f, 1):
            if re.search(r'import \*', content):
                issues.append({
                    "kind": "python-check/wildcard-import",
                    "file": filepath,
                    "line": line_num,
                    "message": "Avoid wildcard imports",
                })

print(json.dumps(issues))
```

## Script Discovery

Scripts are discovered from:

1. `lints/` directory in project root (default)
2. Custom directories via config
3. Paths specified explicitly

### Discovery Rules

- Files must be executable (`chmod +x`)
- Files must have `@viola-lint` marker in first 20 lines
- Or have companion `.meta.json` file
- Supported extensions: `.sh`, `.bash`, `.py`, `.rb`, `.pl`, (none)

## Security Considerations

Running scripts is code execution. Keep these practices in mind:

1. **Only run scripts from trusted sources**. Scripts in your repo, not downloaded from the
   internet.
2. **Review scripts before adding**. Understand what they do.
3. **Use explicit script paths**. Instead of directory scanning when possible.
4. **Don't pass sensitive env vars**. Unless scripts specifically need them.
5. **Set appropriate timeouts**. Prevent runaway scripts.

## Error Handling

The plugin handles script failures without aborting the run:

- **Script not found**. Skipped. Warned only for an explicitly listed path; a missing directory is
  skipped silently.
- **Script not executable**. Skipped. Warned only for an explicitly listed path; a non-executable
  file found by directory scanning is skipped silently.
- **Script timeout**. Process killed, warning logged, no issues returned.
- **Invalid JSON output**. Warning logged with the parse error, no issues returned. An invalid entry
  inside an otherwise valid array is logged with a 100-character excerpt and skipped.
- **Non-zero exit**. Warning logged, no issues returned.

Scripts that fail don't stop other linters from running.

## Development

### Running Tests

Tests require several Deno permissions. Use the provided task:

```bash
deno task test
```

Or run directly with all required flags:

```bash
deno test --allow-read --allow-run --allow-write --allow-env --no-check
```

**Note:** Running `deno test` without flags will fail with permission errors. Always use
`deno task test`.

### Type Checking

```bash
deno task check
```

### Project Structure

```
src/
├── types.ts          # Type definitions
├── metadata.ts       # Script metadata extraction
├── discovery.ts      # Script discovery logic
├── executor.ts       # Script execution with I/O
├── parser.ts         # JSON output parsing
├── linter.ts         # ScriptLinter class
└── plugin.ts         # Plugin factory

tests/
├── *_test.ts         # Unit and integration tests
└── fixtures/         # Test fixture scripts

examples/
└── *.sh              # Example lint scripts
```

## Support

Whether you use this project, have learned something from it, or just like it, please consider
supporting it by buying me a coffee, so I can dedicate more time on open-source projects like this
:)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license
> [here](https://github.com/hiisi-digital/viola-script-lints/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
