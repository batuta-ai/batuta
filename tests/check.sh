#!/usr/bin/env bash
# Contract checks for the host package. Read-only.
set -u
cd "$(dirname "$0")/.."
fail=0
bad() { fail=1; printf 'FAIL %s\n' "$*"; }

# 1. Source-only release configuration parses.
python3 -c "import json;json.load(open('release-please-config.json'))" 2>/dev/null \
  || bad "release-please-config.json is not valid JSON"

# 2. The source checkout is a valid runtime artifact.
out=$(node scripts/check-artifact.js . 2>&1) || bad "runtime artifact:"$'\n'"$out"

# 3. No dependency on retired integrations outside history docs.
hits=$(grep -rnE 'superpowers\.md|codex-plugin\.md|compozy\.md' --include='*.md' --include='*.json' --include='*.sh' --include='*.js' . \
       | grep -vE '^\./(docs/|CHANGELOG\.md|skills/)' || true)
[ -z "$hits" ] || bad "retired integration references:"$'\n'"$hits"

# 4. The behavior tests.
out=$(node --test tests/*.test.js 2>&1) || bad "installer tests:"$'\n'"$out"

[ "$fail" -eq 0 ] && echo "batuta check: ok" || { echo "batuta check: FAILED"; exit 1; }
