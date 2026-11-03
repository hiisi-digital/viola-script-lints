# `viola-script-lints`

[![JSR](https://jsr.io/badges/@hiisi/viola-script-lints)](https://jsr.io/@hiisi/viola-script-lints)

> Run shell scripts as custom lints for viola.

A plugin for [viola](https://github.com/hiisi-digital/viola) that runs scripts as convention lints, in bash, python or anything else that reads stdin and writes JSON. Project-specific lints can live in the repo and need no TypeScript and no compile step, and they can use grep, awk, jq or ripgrep.

## Usage

```bash
deno add jsr:@hiisi/viola-script-lints
```

A script goes in a `lints/` directory, is made executable, and declares itself in header comments. The script gets the file paths to check on stdin, one per line, and prints a JSON array of issues.

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

```ts
// viola.config.ts
import { viola } from "@hiisi/viola";
import scriptLints from "@hiisi/viola-script-lints";

export default viola()
  .use(scriptLints()); // discovers scripts from lints/
```

An issue has a `kind` like `my-script/some-issue`, a `file`, a `line`, an optional `column`, a `message`, and optionally a `confidence` and a `suggestion`. Exit code 0 means the script ran, whether or not it found anything, and any other code is a failure, which logs a warning and discards that run's output without stopping the other linters. A timeout, invalid JSON, a missing script and a script that isn't executable are handled the same way, and an invalid entry inside an otherwise valid array is skipped.

Metadata can also come from a companion file named by appending `.meta.json` to the script's full name. `@viola-lint`, `@id` and `@name` are required, `@description` and `@extensions` are optional, and `@category` and `@impact` are parsed and then unused, because a script linter reports an empty issue catalog and viola takes an issue's category and impact from that, so a rule written with `when.category` or `when.impact` never matches a script's issues. `scriptLints()` takes `directories` (default `["lints"]`), `scripts` for explicit paths, `timeout` in milliseconds (default 30000), `env` and `cwd`.

## Status

Against `@hiisi/viola` 0.3.0 the `.use(scriptLints())` call throws, because `use()` wants a plugin with a `build(viola)` method or a function and `scriptLints()` returns `{ name, linters }`, and loading the package by plugin specifier discovers zero linters. So there is currently no working route from a viola config to these scripts. The tests need several deno permissions, so run them with `deno task test`.

## License

> The project is licensed under the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`

> You can check out the full license [here](https://github.com/hiisi-digital/viola-script-lints/blob/main/LICENSE)
