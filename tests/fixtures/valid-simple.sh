#!/usr/bin/env bash
# @viola-lint
# @id valid-simple
# @name Valid Simple Script
# @description A simple valid script that finds console.log

results="["
first=true

while IFS= read -r file; do
  # Simple check: always report one issue per file for testing
  if ! $first; then results+=","; fi
  first=false
  
  results+='{"kind":"valid-simple/test-issue","file":"'$file'","line":1,"message":"Test issue from simple script"}'
done

echo "${results}]"
