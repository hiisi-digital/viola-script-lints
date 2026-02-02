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
