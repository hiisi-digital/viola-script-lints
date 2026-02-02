#!/usr/bin/env bash
# Verification script to check if test fixtures are properly set up

echo "=== Viola Script Lints - Setup Verification ==="
echo ""

echo "1. Checking if tests/fixtures directory exists..."
if [ -d "tests/fixtures" ]; then
    echo "   ✓ tests/fixtures directory exists"
else
    echo "   ✗ tests/fixtures directory NOT found"
    exit 1
fi
echo ""

echo "2. Checking fixture scripts..."
fixtures=(
    "valid-simple.sh"
    "valid-metadata.sh"
    "timeout-script.sh"
    "invalid-bad-output.sh"
    "invalid-no-marker.sh"
    "json-metadata-script.sh"
    "python-script.py"
    "not-executable.sh"
)

for fixture in "${fixtures[@]}"; do
    path="tests/fixtures/$fixture"
    if [ -f "$path" ]; then
        if [ -x "$path" ] || [ "$fixture" = "not-executable.sh" ]; then
            echo "   ✓ $fixture exists and has correct permissions"
        else
            echo "   ✗ $fixture exists but is NOT executable (run: chmod +x $path)"
        fi
    else
        echo "   ✗ $fixture NOT found"
    fi
done
echo ""

echo "3. Checking if fixture scripts follow protocol..."
echo "   Checking valid-simple.sh has @viola-lint marker..."
if grep -q "@viola-lint" tests/fixtures/valid-simple.sh 2>/dev/null; then
    echo "   ✓ valid-simple.sh has @viola-lint marker"
else
    echo "   ✗ valid-simple.sh missing @viola-lint marker"
fi

echo "   Checking valid-metadata.sh has full metadata..."
if grep -q "@id valid-metadata" tests/fixtures/valid-metadata.sh 2>/dev/null; then
    echo "   ✓ valid-metadata.sh has metadata"
else
    echo "   ✗ valid-metadata.sh missing metadata"
fi
echo ""

echo "4. Testing script execution..."
echo "   Testing valid-simple.sh..."
if echo "test-file.ts" | tests/fixtures/valid-simple.sh 2>/dev/null | jq . > /dev/null 2>&1; then
    echo "   ✓ valid-simple.sh executes and outputs valid JSON"
else
    echo "   ✗ valid-simple.sh failed to execute or output valid JSON"
fi
echo ""

echo "5. Checking deno.json configuration..."
if [ -f "deno.json" ]; then
    echo "   ✓ deno.json exists"
    if grep -q "\"test\":" deno.json; then
        echo "   ✓ deno.json has test task"
        if grep -q "\-\-allow-run" deno.json; then
            echo "   ✓ test task includes --allow-run"
        else
            echo "   ✗ test task missing --allow-run flag"
        fi
    fi
else
    echo "   ✗ deno.json NOT found"
fi
echo ""

echo "6. Running actual tests..."
echo "   Use: deno task test"
echo "   Or:  deno test --allow-read --allow-run --allow-write --allow-env --no-check"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "If all checks passed, tests should work with: deno task test"
echo "If tests still fail, ensure you've pulled the latest changes: git pull origin <branch>"
