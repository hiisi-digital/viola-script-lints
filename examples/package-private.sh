#!/usr/bin/env bash
# @viola-lint
# @id package-private
# @name Package.json Private Field
# @description Ensure package.json has private: true for non-published packages
# @category correctness
# @impact major
# @extensions package.json

results="["
first=true

while IFS= read -r file; do
  [[ "$(basename "$file")" != "package.json" ]] && continue
  
  # Check if package.json has private: true
  private=$(jq -r '.private // false' "$file" 2>/dev/null)
  
  if [[ "$private" != "true" ]]; then
    if ! $first; then results+=","; fi
    first=false
    
    results+=$(jq -n \
      --arg kind "package-private/missing" \
      --arg file "$file" \
      --argjson line 1 \
      --arg message "package.json should have \"private\": true to prevent accidental publishing" \
      --arg suggestion "Add \"private\": true to the top-level of package.json" \
      '{kind: $kind, file: $file, line: $line, message: $message, suggestion: $suggestion}')
  fi
done

echo "${results}]"
