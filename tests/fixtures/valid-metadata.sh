#!/usr/bin/env bash
# @viola-lint
# @id valid-metadata
# @name Valid Metadata Script
# @description A script with full metadata
# @category consistency
# @impact minor
# @extensions .ts,.tsx,.js,.jsx

results="["
first=true

while IFS= read -r file; do
  if ! $first; then results+=","; fi
  first=false
  
  results+='{"kind":"valid-metadata/metadata-test","file":"'$file'","line":5,"column":10,"message":"Test with metadata","confidence":85,"suggestion":"Fix this issue"}'
done

echo "${results}]"
