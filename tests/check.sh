#!/usr/bin/env bash
# Contract checks for the host package. Read-only.
set -u
cd "$(dirname "$0")/.."
fail=0
bad() { fail=1; printf 'FAIL %s\n' "$*"; }

retired_reference_hits() {
  local paths hits file grep_status scan_status=0
  paths=$(mktemp "${TMPDIR:-/tmp}/batuta-retired-paths.XXXXXX") || return 2
  hits=$(mktemp "${TMPDIR:-/tmp}/batuta-retired-hits.XXXXXX") || {
    rm -f "$paths"
    return 2
  }

  if ! git ls-files -z --cached --others --exclude-standard -- \
      '*.md' '*.json' '*.sh' '*.js' > "$paths"; then
    rm -f "$paths" "$hits"
    return 2
  fi

  while IFS= read -r -d '' file; do
    case "$file" in
      docs/*|CHANGELOG.md|skills/*) continue ;;
    esac
    [ -f "$file" ] || continue

    grep -nHE 'superpowers\.md|codex-plugin\.md|compozy\.md' -- "$file" >> "$hits" 2>&1
    grep_status=$?
    case "$grep_status" in
      0|1) ;;
      *) scan_status=$grep_status; break ;;
    esac
  done < "$paths"

  cat "$hits"
  rm -f "$paths" "$hits"
  return "$scan_status"
}

# 1. Every manifest parses.
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json .codex-plugin/plugin.json \
         .agents/plugins/marketplace.json .cursor-plugin/plugin.json .cursor-plugin/marketplace.json \
         hooks/hooks.json skills-lock.json release-please-config.json; do
  python3 -c "import json,sys; json.load(open('$f'))" 2>/dev/null || bad "$f is not valid JSON"
done

# 2. The vendored skills match the lock.
hash=$(cd skills && find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256 | cut -c1-64)
locked=$(python3 -c "import json;print(json.load(open('skills-lock.json'))['computedHash'])")
[ "sha256:$hash" = "$locked" ] || bad "skills/ tree hash sha256:$hash != lock $locked (run scripts/sync-skills.sh)"

# 3. Every command routes to a skill that exists.
out=$(bash scripts/check-commands.sh 2>&1) || bad "command routes:"$'\n'"$out"

# 4. Versions agree across manifests.
v=$(python3 -c "import json;print(json.load(open('.claude-plugin/plugin.json'))['version'])")
for f in .codex-plugin/plugin.json .cursor-plugin/plugin.json; do
  fv=$(python3 -c "import json;print(json.load(open('$f'))['version'])")
  [ "$fv" = "$v" ] || bad "$f version $fv != $v"
done

# 5. No dependency on retired integrations outside history docs.
hits=$(retired_reference_hits)
scan_status=$?
if [ "$scan_status" -ne 0 ]; then
  bad "retired integration scan failed:"$'\n'"$hits"
elif [ -n "$hits" ]; then
  bad "retired integration references:"$'\n'"$hits"
fi

# 6. The installer's behaviour tests.
out=$(node --test tests/*.test.js 2>&1) || bad "installer tests:"$'\n'"$out"

[ "$fail" -eq 0 ] && echo "batuta check: ok" || { echo "batuta check: FAILED"; exit 1; }
