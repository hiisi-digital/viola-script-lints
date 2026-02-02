#!/usr/bin/env bash
# @viola-lint
# @id file-naming
# @name File Naming Convention
# @description Enforce kebab-case naming for all files
# @category consistency
# @impact minor

results="["
first=true

while IFS= read -r file; do
  basename=$(basename "$file")
  
  # Skip hidden files and files with special purposes
  [[ "$basename" == .* ]] && continue
  [[ "$basename" == "README.md" ]] && continue
  [[ "$basename" == "LICENSE" ]] && continue
  
  # Check if filename follows kebab-case (lowercase, hyphens only)
  # Allow dots for extensions
  name_without_ext="${basename%.*}"
  
  if [[ ! "$name_without_ext" =~ ^[a-z0-9-]+$ ]]; then
    if ! $first; then results+=","; fi
    first=false
    
    results+=$(jq -n \
      --arg kind "file-naming/not-kebab-case" \
      --arg file "$file" \
      --argjson line 1 \
      --arg message "File name should use kebab-case (lowercase with hyphens)" \
      --arg suggestion "Rename to use only lowercase letters, numbers, and hyphens" \
      '{kind: $kind, file: $file, line: $line, message: $message, suggestion: $suggestion}')
  fi
done

echo "${results}]"
