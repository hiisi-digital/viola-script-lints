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
      --arg suggestion "Create an issue and replace FIXME with a TODO referencing the issue" \
      '{kind: $kind, file: $file, line: $line, message: $message, suggestion: $suggestion}')
  done < <(grep -n "FIXME" "$file" 2>/dev/null || true)
done

echo "${results}]"
