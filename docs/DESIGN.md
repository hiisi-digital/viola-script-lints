# viola-script-lints Design Document

## Overview

`@hiisi/viola-script-lints` is a plugin for the Viola convention linter that enables running arbitrary shell scripts as custom lints. This allows teams to add project-specific convention checks without writing TypeScript.

## Purpose

This package provides:

1. **Script discovery** - Find and load lint scripts from configurable directories
2. **Script execution** - Run scripts with standardized input/output protocols
3. **Result parsing** - Convert script output to Viola issues
4. **Script authoring utilities** - Helpers for writing lint scripts

## Why Scripts?

- **Low barrier to entry** - Anyone who can write bash can write a lint
- **Language agnostic** - Scripts can be bash, python, perl, whatever
- **Project-specific** - Keep custom lints in your repo, not a separate package
- **Rapid iteration** - No compile step, just edit and run
- **Leverage existing tools** - Use grep, awk, jq, ripgrep, etc.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   @hiisi/viola-script-lints                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Plugin Interface                        │ │
│  │  scriptLints: ViolaPlugin                                 │ │
│  │  - Discovers scripts in configured directories            │ │
│  │  - Creates ScriptLinter for each script                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    ScriptLinter                            │ │
│  │  - Wraps a single script as a BaseLinter                  │ │
│  │  - Executes script with file list on stdin                │ │
│  │  - Parses JSON output as issues                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Script Protocol                         │ │
│  │  Input:  File paths on stdin (one per line)               │ │
│  │  Output: JSON array of issues on stdout                   │ │
│  │  Exit:   0 = success, non-zero = error                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Script Protocol

### Input

Scripts receive file paths on stdin, one per line:

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

- `0` - Success (may have found issues, but script ran correctly)
- `1` - Script error (invalid input, crash, etc.)
- `2` - Configuration error

### Metadata

Scripts can declare metadata via a header comment:

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

Or via a companion `.meta.json` file:

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

## Script Discovery

Scripts are discovered from:

1. `lints/` directory in project root (default)
2. Custom directories via config
3. Paths specified explicitly

```typescript
// viola.config.ts
import { viola } from "@hiisi/viola";
import scriptLints from "@hiisi/viola-script-lints";

export default viola()
  .use(scriptLints({
    directories: ["lints", "custom-checks"],
    scripts: ["scripts/special-check.sh"],
  }));
```

### Discovery Rules

- Files must be executable (`chmod +x`)
- Files must have `@viola-lint` marker in first 10 lines
- Or have companion `.meta.json` file
- Supported extensions: `.sh`, `.bash`, `.py`, `.rb`, `.pl`, (none)

## Example Scripts

### Simple grep-based check

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
      --arg suggestion "Use a proper logging library instead" \
      '{kind: $kind, file: $file, line: $line, message: $message, suggestion: $suggestion}')
  done < <(grep -n "console\.log" "$file" 2>/dev/null || true)
done

echo "${results}]"
```

### Using jq for JSON files

```bash
#!/usr/bin/env bash
# @viola-lint
# @id package-json-private
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
      '{kind: "package-json-private/missing", file: $file, line: 1, message: "package.json should have private: true"}')
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
# @extensions .py

import sys
import json

issues = []

for line in sys.stdin:
    filepath = line.strip()
    # ... check logic ...
    
print(json.dumps(issues))
```

## File Structure

```
viola-script-lints/
├── mod.ts                 # Main export (ViolaPlugin)
├── deno.json             # Package manifest
├── README.md             # Usage documentation
├── LICENSE               # MPL-2.0
├── docs/
│   ├── DESIGN.md         # This file
│   └── TODO.md           # Implementation tasks
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── src/
│   ├── plugin.ts         # ViolaPlugin implementation
│   ├── discovery.ts      # Script discovery logic
│   ├── executor.ts       # Script execution
│   ├── parser.ts         # Output parsing
│   ├── linter.ts         # ScriptLinter class
│   ├── metadata.ts       # Metadata extraction
│   └── types.ts          # Type definitions
└── tests/
    ├── discovery_test.ts
    ├── executor_test.ts
    ├── parser_test.ts
    └── fixtures/
        ├── valid-script.sh
        ├── invalid-script.sh
        └── python-script.py
```

## Dependencies

- `@hiisi/viola` - Core runtime and types
- `@std/path` - Path utilities
- `@std/fs` - File system utilities

## Configuration

```typescript
interface ScriptLintsOptions {
  /** Directories to search for scripts (default: ["lints"]) */
  directories?: string[];
  
  /** Explicit script paths to include */
  scripts?: string[];
  
  /** File extensions to include (default: all) */
  extensions?: string[];
  
  /** Timeout for script execution in ms (default: 30000) */
  timeout?: number;
  
  /** Environment variables to pass to scripts */
  env?: Record<string, string>;
  
  /** Working directory for scripts (default: project root) */
  cwd?: string;
}
```

## Usage Patterns

### Basic usage

```typescript
import { viola } from "@hiisi/viola";
import scriptLints from "@hiisi/viola-script-lints";

export default viola()
  .use(scriptLints());  // Discovers scripts from lints/
```

### Custom directories

```typescript
export default viola()
  .use(scriptLints({
    directories: ["lints", "checks", ".viola/scripts"],
  }));
```

### Explicit scripts

```typescript
export default viola()
  .use(scriptLints({
    scripts: [
      "scripts/check-imports.sh",
      "scripts/check-naming.py",
    ],
  }));
```

### With nutshell integration

```typescript
export default viola()
  .use(scriptLints({
    env: {
      NUTSHELL_ROOT: "/path/to/nutshell",
    },
  }));
```

## Security Considerations

1. **Script execution** - Only run scripts from trusted sources
2. **Path traversal** - Validate file paths before passing to scripts
3. **Timeout** - Enforce execution timeout to prevent hangs
4. **Output size** - Limit output size to prevent memory exhaustion
5. **Environment** - Don't pass sensitive env vars to scripts

## Error Handling

- **Script not found** - Log warning, skip script
- **Script not executable** - Log warning, skip script
- **Script timeout** - Kill process, report as error
- **Invalid JSON output** - Report parse error with raw output
- **Non-zero exit** - Report script error

## Testing Strategy

1. **Unit tests** for discovery, parsing, metadata extraction
2. **Integration tests** with real scripts
3. **Fixture scripts** covering edge cases
4. **Timeout tests** with slow scripts
5. **Error handling tests** with invalid scripts

## Performance Considerations

1. **Parallel execution** - Run scripts in parallel (configurable)
2. **Caching** - Cache script metadata between runs
3. **Incremental** - Only pass changed files to scripts (future)
4. **Batching** - Pass all files at once vs one-by-one (configurable)

## Future Enhancements

- Watch mode integration
- Script templates/generators
- Script validation command
- Performance profiling
- Remote script loading (with verification)
