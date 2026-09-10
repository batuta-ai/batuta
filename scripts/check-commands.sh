#!/usr/bin/env bash
# Check that every command routes to a vendored skill.
set -u
root=${1:-"$(dirname "$0")/.."}
fail=0

for command in "$root"/commands/*.md "$root"/hosts/opencode/commands/*.md; do
  skill=$(grep -oE '`batuta(-[a-z]+)*` skill' "$command" | head -1 | grep -oE 'batuta(-[a-z]+)*')
  if ! { [ -n "$skill" ] && [ -f "$root/skills/$skill/SKILL.md" ]; }; then
    printf 'FAIL %s does not route to an existing skill\n' "${command#"$root"/}"
    fail=1
  fi
done

exit "$fail"
