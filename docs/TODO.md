# TODO - viola-script-lints

Shell script runner plugin for the Viola convention linter.

## 📋 Phase 1: Foundation

### Project Setup
- [ ] Initialize deno.json with package metadata
- [ ] Set up imports for @hiisi/viola, @std/path, @std/fs
- [ ] Create basic module structure
- [ ] Add LICENSE (MPL-2.0)
- [ ] Write README.md with usage examples

### Type Definitions (`src/types.ts`)
- [ ] Define ScriptLintsOptions interface
- [ ] Define ScriptMetadata interface
- [ ] Define ScriptIssue interface (JSON output format)
- [ ] Define ScriptResult interface

## 📋 Phase 2: Core Implementation

### Metadata Extraction (`src/metadata.ts`)
- [ ] Parse header comments for @viola-lint marker
- [ ] Extract @id, @name, @description from comments
- [ ] Extract @category, @impact, @extensions
- [ ] Load companion .meta.json files
- [ ] Merge comment metadata with JSON metadata
- [ ] Validate required fields (id, name)

### Script Discovery (`src/discovery.ts`)
- [ ] Scan configured directories for scripts
- [ ] Filter by executable permission
- [ ] Filter by @viola-lint marker or .meta.json
- [ ] Support multiple script extensions (.sh, .bash, .py, .rb, .pl, none)
- [ ] Handle explicit script paths from config
- [ ] Deduplicate discovered scripts

### Script Execution (`src/executor.ts`)
- [ ] Spawn script process
- [ ] Pass file paths on stdin (one per line)
- [ ] Capture stdout for JSON output
- [ ] Capture stderr for error logging
- [ ] Enforce timeout (default 30s)
- [ ] Handle non-zero exit codes
- [ ] Pass configured environment variables
- [ ] Set working directory

### Output Parsing (`src/parser.ts`)
- [ ] Parse JSON array from stdout
- [ ] Validate issue structure (kind, file, line, message)
- [ ] Map script output to Viola Issue type
- [ ] Handle parse errors gracefully
- [ ] Report invalid JSON with helpful error

### ScriptLinter Class (`src/linter.ts`)
- [ ] Extend BaseLinter
- [ ] Generate meta from script metadata
- [ ] Generate catalog from script metadata
- [ ] Implement lint() method using executor
- [ ] Handle file filtering by extensions

### Plugin Implementation (`src/plugin.ts`)
- [ ] Implement ViolaPlugin interface
- [ ] Discover scripts during build()
- [ ] Create ScriptLinter for each script
- [ ] Register linters with viola
- [ ] Support options (directories, scripts, timeout, env)

### Main Export (`mod.ts`)
- [ ] Export plugin factory function
- [ ] Export types for script authors
- [ ] Export utility functions

## 📋 Phase 3: Testing

### Unit Tests
- [ ] `tests/metadata_test.ts` - Header parsing, JSON loading
- [ ] `tests/discovery_test.ts` - Directory scanning, filtering
- [ ] `tests/executor_test.ts` - Process spawning, I/O
- [ ] `tests/parser_test.ts` - JSON parsing, validation

### Test Fixtures
- [ ] `tests/fixtures/valid-simple.sh` - Basic working script
- [ ] `tests/fixtures/valid-metadata.sh` - Full metadata in comments
- [ ] `tests/fixtures/valid-metadata.meta.json` - Companion JSON
- [ ] `tests/fixtures/invalid-no-marker.sh` - Missing @viola-lint
- [ ] `tests/fixtures/invalid-not-executable.sh` - Missing +x
- [ ] `tests/fixtures/invalid-bad-output.sh` - Invalid JSON output
- [ ] `tests/fixtures/timeout-script.sh` - Slow script for timeout test
- [ ] `tests/fixtures/python-script.py` - Python example

### Integration Tests
- [ ] `tests/integration_test.ts` - Full plugin workflow
- [ ] Test with real viola config
- [ ] Test script discovery from directories
- [ ] Test explicit script paths
- [ ] Test timeout handling

## 📋 Phase 4: Documentation & Polish

### Documentation
- [ ] Complete README with examples
- [ ] Document script protocol (input/output)
- [ ] Document metadata format
- [ ] Add example scripts in docs/
- [ ] Document security considerations

### Example Scripts
- [ ] `examples/no-console-log.sh` - grep-based check
- [ ] `examples/package-private.sh` - jq-based JSON check
- [ ] `examples/no-fixme.sh` - TODO/FIXME finder
- [ ] `examples/file-naming.sh` - Naming convention check

### Polish
- [ ] Ensure all tests pass
- [ ] Type checking passes
- [ ] Error messages are helpful
- [ ] Logging is useful but not noisy

## 📋 Phase 5: Advanced Features (Future)

### Parallel Execution
- [ ] Run multiple scripts in parallel
- [ ] Configurable concurrency limit
- [ ] Aggregate results

### Caching
- [ ] Cache script metadata between runs
- [ ] Invalidate on script modification

### Incremental Mode
- [ ] Track which files changed
- [ ] Only pass changed files to scripts

### Script Utilities
- [ ] Helper library for bash scripts
- [ ] JSON output helpers
- [ ] File filtering helpers

## CI/CD

- [ ] CI workflow (thin wrapper to reusable)
- [ ] Release workflow (thin wrapper to reusable)
- [ ] Test on Linux and macOS

## Notes

### Script Protocol Summary

**Input:** File paths on stdin, one per line
**Output:** JSON array of issues on stdout
**Exit:** 0 = success, non-zero = error

### Issue JSON Format

```json
{
  "kind": "script-id/issue-type",
  "file": "path/to/file.ts",
  "line": 42,
  "column": 10,
  "message": "Description of the issue",
  "confidence": 80,
  "suggestion": "How to fix it"
}
```

### Metadata Header Format

```bash
#!/usr/bin/env bash
# @viola-lint
# @id my-check
# @name My Check
# @description What it checks
# @category consistency
# @impact minor
# @extensions .ts,.js
```

### Dependencies

- `@hiisi/viola` - Core runtime
- `@std/path` - Path utilities
- `@std/fs` - File system utilities
- `@std/assert` - Testing

Do not add new dependencies without explicit approval.
