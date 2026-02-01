# Copilot Instructions for viola-script-lints

Shell script runner plugin for the Viola convention linter. Runtime: Deno (TypeScript).

## CRITICAL: Accessing @hiisi/viola Core Package

The `@hiisi/viola` package contains all the types and utilities you need. It is NOT yet published to JSR, so you MUST access it via GitHub.

### Option 1: Use Git Import in deno.json (RECOMMENDED)

Update `deno.json` imports to use GitHub raw URL:

```json
{
  "imports": {
    "@hiisi/viola": "https://raw.githubusercontent.com/hiisi-digital/viola/main/mod.ts",
    "@hiisi/viola/linters": "https://raw.githubusercontent.com/hiisi-digital/viola/main/src/linters/mod.ts"
  }
}
```

### Option 2: Use GitHub MCP Server to Read Types

You have access to the GitHub MCP server. Use it to read the viola core types:

1. **Read linter types**: Use `get_file_contents` on `hiisi-digital/viola` repo, path `src/linters/types.ts`
2. **Read base linter**: Path `src/linters/base.ts`
3. **Read plugin system**: Path `src/plugins/types.ts`

Key files in the viola core repo (`hiisi-digital/viola`):
- `src/linters/types.ts` - BaseLinter, LinterMeta, Issue, IssueCatalog
- `src/linters/base.ts` - BaseLinter abstract class
- `src/plugins/types.ts` - ViolaPlugin interface
- `src/data/types.ts` - Codebase, FileInfo, SourceLocation
- `DESIGN-LANGUAGE-AGNOSTIC.md` - Full architecture documentation

### DO NOT create stub types

Do NOT create your own stub types for BaseLinter, Issue, etc. The real types exist in the viola repo - use the GitHub MCP server to read them, then use git imports.

## Project Context

This package enables running arbitrary shell scripts as custom lints. It provides:
- Script discovery from configurable directories
- Script execution with standardized input/output protocol
- Result parsing and conversion to Viola issues
- Metadata extraction from script headers or companion JSON files

## CRITICAL: Script Protocol

Scripts receive file paths on stdin (one per line) and output JSON issues to stdout:

```bash
# Input (stdin):
src/utils/helpers.ts
src/components/Button.tsx

# Output (stdout):
[
  {
    "kind": "my-script/some-issue",
    "file": "src/utils/helpers.ts",
    "line": 42,
    "message": "Found a problem"
  }
]
```

### Exit Codes

- `0` - Success (may have found issues, but script ran correctly)
- `1` - Script error (invalid input, crash, etc.)
- `2` - Configuration error

### Script Metadata Format

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

## Before Starting Work

- **Check current branch**: If not main, you're likely working on a PR
- **Check for branch TODO**: Look for `TODO.{branch-name}.md`, use it instead of main `TODO.md`
- **Read docs/DESIGN.md**: Understand the script protocol and architecture
- **Read docs/TODO.md**: Know what tasks need implementation
- **Search for existing code**: Grep codebase for similar functions BEFORE writing new ones
- **Check @hiisi/viola/linters**: Understand the types you're implementing against

## Core Principles

### 1. Script Authors Come First

**The API should be easy for script authors**

Scripts should be simple to write and debug. Don't make script authors jump through hoops.

**Implications:**
- Clear, simple protocol (stdin/stdout JSON)
- Helpful error messages when scripts fail
- Easy metadata format (comments or JSON)
- Good documentation with examples

### 2. Graceful Degradation

**Never crash on bad scripts**

Invalid scripts should be skipped with warnings, not crash the linter.

**Implications:**
- Validate script output, don't trust it
- Handle timeouts gracefully
- Report parse errors with context
- Continue running other scripts if one fails
- Return empty issues array on script failure

### 3. Security Awareness

**Scripts are code execution**

Be mindful that running scripts has security implications.

**Implications:**
- Only run scripts from configured directories
- Validate file paths before passing to scripts
- Document security considerations clearly
- Don't pass sensitive environment variables by default
- Enforce timeouts to prevent hangs

### 4. Reuse-First

**Search for existing code before writing anything new**

Before writing ANY function, type, or utility, search the codebase. Equivalent code likely exists.

**Implications:**
- ALWAYS check what exists before implementing
- Small helpers (3+ lines used twice) belong in shared modules
- Check `@hiisi/viola` for utilities before writing new ones
- Never write inline helpers - extract to shared location

**Red Flags:**
- Writing helper functions inside implementation files
- Copy-pasting code between modules
- Writing string/path utilities without checking viola core

### 5. Design Before Code

**Order: Design → Types → Tests → Implementation**

Tests encode the specification. Changing tests to pass defeats the purpose.

**Implications:**
- DESIGN.md must be accurate before coding
- Tests written to fail initially
- Never modify tests during implementation
- If tests are wrong, the design was wrong - fix design first

### 6. Data Separate from Logic

**Types live apart from implementation**

**Implications:**
- Type definitions in `src/types.ts`
- Implementation modules use those types, never redefine them
- If file exports both types AND logic, refactor immediately

### 7. BaseLinter Pattern

**Each script becomes a BaseLinter**

ScriptLinter wraps scripts to fit the Viola linter interface.

**Implications:**
- Generate LinterMeta from script metadata
- Generate IssueCatalog from script metadata
- Implement lint() to execute script and parse output
- Follow the same patterns as @hiisi/viola-default-lints

### 8. Correctness Over Completeness

**It's better to run fewer scripts correctly than more scripts incorrectly**

**Implications:**
- Handle edge cases gracefully with sensible defaults
- Never crash on malformed script output - use error recovery
- Return empty arrays for missing/invalid data
- Log warnings for unexpected patterns (in development)

### 9. Real Tests No Stubs

**Tests use real script execution**

**Implications:**
- Create fixture scripts with real functionality
- Run actual scripts in tests
- Assert actual execution results
- No mocking of script execution internals

## File Structure

```
viola-script-lints/
├── mod.ts                 # Main export (ViolaPlugin factory)
├── deno.json             # Package manifest
├── README.md             # Usage documentation
├── LICENSE               # MPL-2.0
├── docs/
│   ├── DESIGN.md         # Architecture documentation
│   └── TODO.md           # Implementation tasks
├── .github/
│   ├── copilot-instructions.md  # This file
│   └── workflows/
│       ├── ci.yml        # Thin wrapper to reusable
│       └── release.yml   # Thin wrapper to reusable
├── src/
│   ├── types.ts          # Type definitions (ScriptLintsOptions, ScriptMetadata, etc.)
│   ├── metadata.ts       # Metadata extraction from headers and JSON
│   ├── discovery.ts      # Script discovery from directories
│   ├── executor.ts       # Script execution (spawn, stdin, stdout, timeout)
│   ├── parser.ts         # JSON output parsing and validation
│   ├── linter.ts         # ScriptLinter class extending BaseLinter
│   └── plugin.ts         # ViolaPlugin implementation
└── tests/
    ├── metadata_test.ts  # Header parsing, JSON loading tests
    ├── discovery_test.ts # Directory scanning, filtering tests
    ├── executor_test.ts  # Process spawning, I/O, timeout tests
    ├── parser_test.ts    # JSON parsing, validation tests
    ├── integration_test.ts # Full plugin workflow tests
    └── fixtures/
        ├── valid-simple.sh       # Basic working script
        ├── valid-metadata.sh     # Full metadata in comments
        ├── valid-metadata.meta.json # Companion JSON example
        ├── invalid-no-marker.sh  # Missing @viola-lint
        ├── invalid-bad-output.sh # Invalid JSON output
        ├── timeout-script.sh     # Slow script for timeout test
        └── python-script.py      # Python example
```

## Workflow

### Before Starting

1. Read docs/DESIGN.md to understand architecture
2. Read docs/TODO.md for current tasks
3. Check existing code for patterns to follow
4. Read @hiisi/viola core types (BaseLinter, Issue, ViolaPlugin)

### Implementation Process

1. Write types first (`src/types.ts`)
2. Write tests (TDD preferred)
3. Implement the minimal solution
4. Refactor for clarity
5. Add documentation

### Before Marking Done

1. Verify all tests pass (`deno test`)
2. Type checking passes (`deno check mod.ts`)
3. DESIGN.md matches implementation
4. Public APIs are documented with JSDoc
5. No TODO comments left unaddressed
6. Script protocol is documented in README

## Coding Standards

### TypeScript

- Strict mode enabled (noImplicitAny, strictNullChecks)
- No `any` types - use `unknown` and narrow
- Prefer `interface` for object shapes, `type` for unions
- Use `readonly` for immutable data
- Explicit return types on exported functions

### Naming

- Files: `kebab-case.ts`
- Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Error Handling

Handle all script-related errors gracefully:

```typescript
// Good
try {
  const output = await executeScript(script, files, timeout);
  return parseOutput(output);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.warn(`Script ${script.id} timed out after ${timeout}ms`);
    return [];
  }
  console.error(`Script ${script.id} failed: ${error.message}`);
  return [];
}

// Bad - lets errors propagate and crash
const output = await executeScript(script, files, timeout);
return parseOutput(output);
```

### Documentation

- All public exports must have JSDoc
- Include `@example` for complex functions
- Keep descriptions concise but complete
- Document the script protocol clearly

### Testing

- Every feature needs tests
- Test both success cases and edge cases
- Use descriptive test names: `"parseMetadata - extracts id from header comment"`
- Include real scripts as fixtures
- Test timeout handling with slow scripts

## Commits

Format: `type: lowercase message`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`

### Good Examples

- `feat: add script metadata extraction from comments`
- `fix: handle script timeout gracefully`
- `refactor: split discovery logic into separate module`
- `test: add executor timeout tests`
- `docs: document script protocol in README`

### Bad Examples

- `feat(metadata): Add metadata parsing` (no scope needed, no capital)
- `Fixed the thing` (no type, not specific)
- `WIP` (not descriptive)
- `Added feature` (no type)

## Don't

- Add files without documenting in appropriate places
- Mix types and logic in same file
- Modify tests to make them pass
- Use emojis (except ⚠️ 🚧 for warnings)
- Use marketing language
- Write logic before understanding the types it uses
- Do unrelated changes in feature branches
- Write helper functions inline - extract to shared modules
- Write code without first searching for existing equivalents
- Copy-paste code between files - extract and import
- Skip reading DESIGN.md before implementing
- Add new dependencies without explicit approval
- Trust script output without validation
- Pass arbitrary environment variables to scripts
- Allow path traversal in file paths
- Skip timeout enforcement
- Ignore script exit codes
- Leave TODO comments without issue reference

## Dependencies

Only these dependencies should be used:

- `@hiisi/viola` - Core package (via GitHub raw URL until JSR published)
- `@hiisi/viola/linters` - Linter types (via GitHub raw URL)
- `@std/path` - Path utilities
- `@std/fs` - File system utilities
- `@std/assert` - Testing

**Import pattern in deno.json:**
```json
{
  "name": "@hiisi/viola-script-lints",
  "version": "0.1.0",
  "exports": "./mod.ts",
  "imports": {
    "@hiisi/viola": "https://raw.githubusercontent.com/hiisi-digital/viola/main/mod.ts",
    "@hiisi/viola/linters": "https://raw.githubusercontent.com/hiisi-digital/viola/main/src/linters/mod.ts",
    "@std/path": "jsr:@std/path@^1",
    "@std/fs": "jsr:@std/fs@^1",
    "@std/assert": "jsr:@std/assert@^1"
  }
}
```

Do not add new dependencies without explicit approval.

## Code Constraints

| Rule | Limit | Reason |
|------|-------|--------|
| Max file size | 500 LOC (prefer <300) | Maintainability |
| Max exports per file | ~5 | Single responsibility |
| Function length | <50 LOC | Readability |
| Script timeout | 30s default | Prevent hangs |
| Output size | 10MB max | Memory safety |

## Key Implementation Details

### Metadata Extraction

Parse script headers for the `@viola-lint` marker and metadata fields:

```typescript
function parseMetadataFromHeader(content: string): ScriptMetadata | null {
  const lines = content.split('\n').slice(0, 20); // Check first 20 lines
  
  // Must have @viola-lint marker
  if (!lines.some(line => line.includes('@viola-lint'))) {
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
      metadata.extensions = extMatch[1].split(',').map(e => e.trim());
    }
  }
  
  // id and name are required
  if (!metadata.id || !metadata.name) {
    return null;
  }
  
  return metadata as ScriptMetadata;
}
```

### Script Execution

Execute scripts with proper I/O handling:

```typescript
async function executeScript(
  scriptPath: string,
  files: string[],
  options: ExecutionOptions
): Promise<ScriptResult> {
  const command = new Deno.Command(scriptPath, {
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: options.cwd,
    env: options.env,
  });
  
  const process = command.spawn();
  
  // Write file paths to stdin
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(files.join('\n')));
  await writer.close();
  
  // Set up timeout
  const timeoutId = setTimeout(() => {
    process.kill("SIGTERM");
  }, options.timeout);
  
  try {
    const { code, stdout, stderr } = await process.output();
    clearTimeout(timeoutId);
    
    return {
      exitCode: code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

### Output Parsing

Parse and validate script JSON output:

```typescript
interface ScriptIssue {
  kind: string;
  file: string;
  line: number;
  column?: number;
  message: string;
  confidence?: number;
  suggestion?: string;
}

function parseScriptOutput(stdout: string, scriptId: string): Issue[] {
  if (!stdout.trim()) {
    return [];
  }
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    console.warn(`Script ${scriptId} produced invalid JSON output`);
    return [];
  }
  
  if (!Array.isArray(parsed)) {
    console.warn(`Script ${scriptId} output is not an array`);
    return [];
  }
  
  return parsed
    .filter(isValidScriptIssue)
    .map(issue => ({
      kind: issue.kind,
      location: {
        file: issue.file,
        line: issue.line,
        column: issue.column ?? 1,
      },
      message: issue.message,
      confidence: issue.confidence ?? 100,
      context: issue.suggestion ? { suggestion: issue.suggestion } : undefined,
    }));
}

function isValidScriptIssue(obj: unknown): obj is ScriptIssue {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.kind === 'string' &&
    typeof o.file === 'string' &&
    typeof o.line === 'number' &&
    typeof o.message === 'string'
  );
}
```

### ScriptLinter Class

Wrap a script as a BaseLinter:

```typescript
class ScriptLinter extends BaseLinter {
  private scriptPath: string;
  private scriptMeta: ScriptMetadata;
  private timeout: number;
  
  constructor(scriptPath: string, meta: ScriptMetadata, timeout = 30000) {
    super();
    this.scriptPath = scriptPath;
    this.scriptMeta = meta;
    this.timeout = timeout;
  }
  
  get meta(): LinterMeta {
    return {
      id: this.scriptMeta.id,
      name: this.scriptMeta.name,
      description: this.scriptMeta.description ?? '',
      category: this.scriptMeta.category ?? 'custom',
      impact: this.scriptMeta.impact ?? 'minor',
    };
  }
  
  get catalog(): IssueCatalog {
    // Scripts define their own issue kinds
    return {};
  }
  
  async lint(codebase: Codebase, config: LinterConfig): Promise<Issue[]> {
    // Filter files by extensions if specified
    let files = codebase.files.map(f => f.path);
    if (this.scriptMeta.extensions?.length) {
      files = files.filter(f => 
        this.scriptMeta.extensions!.some(ext => f.endsWith(ext))
      );
    }
    
    if (files.length === 0) {
      return [];
    }
    
    try {
      const result = await executeScript(this.scriptPath, files, {
        timeout: this.timeout,
        cwd: codebase.root,
      });
      
      if (result.exitCode !== 0) {
        console.warn(`Script ${this.scriptMeta.id} exited with code ${result.exitCode}`);
        if (result.stderr) {
          console.warn(`stderr: ${result.stderr}`);
        }
        return [];
      }
      
      return parseScriptOutput(result.stdout, this.scriptMeta.id);
    } catch (error) {
      console.error(`Script ${this.scriptMeta.id} failed: ${error}`);
      return [];
    }
  }
}
```

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
      '{kind: $kind, file: $file, line: $line, message: $message}')
  done < <(grep -n "console\.log" "$file" 2>/dev/null || true)
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

issues = []

for line in sys.stdin:
    filepath = line.strip()
    if not filepath:
        continue
    
    # Your check logic here
    # ...
    
print(json.dumps(issues))
```

## Review Checklist

Before marking work complete:

- [ ] All tests pass (`deno test`)
- [ ] Type checking passes (`deno check mod.ts`)
- [ ] Public APIs are documented with JSDoc
- [ ] No TODO comments left unaddressed
- [ ] Code follows project conventions
- [ ] Script protocol is documented in README
- [ ] Timeouts are enforced
- [ ] Errors are handled gracefully
- [ ] Output is validated before use
- [ ] Security considerations documented
- [ ] Example scripts provided
- [ ] DESIGN.md matches implementation
- [ ] TODO.md is up to date
