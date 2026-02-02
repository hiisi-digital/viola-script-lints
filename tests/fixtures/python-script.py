#!/usr/bin/env python3
# @viola-lint
# @id python-test
# @name Python Test Script
# @description Example Python lint script
# @extensions .py

import sys
import json

issues = []

for line in sys.stdin:
    filepath = line.strip()
    if not filepath:
        continue
    
    # Simple test: report one issue per file
    issues.append({
        "kind": "python-test/test-issue",
        "file": filepath,
        "line": 1,
        "message": "Test issue from Python script"
    })

print(json.dumps(issues))
