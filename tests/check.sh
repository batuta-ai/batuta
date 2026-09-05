#!/usr/bin/env bash
# Contract checks for the host package. Read-only.
set -u
cd "$(dirname "$0")/.."
fail=0
bad() { fail=1; printf 'FAIL %s\n' "$*"; }

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
for c in commands/*.md hosts/opencode/commands/*.md; do
  skill=$(grep -oE '`batuta(-[a-z]+)?` skill' "$c" | head -1 | grep -oE 'batuta(-[a-z]+)?')
  [ -n "$skill" ] && [ -f "skills/$skill/SKILL.md" ] || bad "$c does not route to an existing skill"
done

# 4. Versions agree across manifests.
v=$(python3 -c "import json;print(json.load(open('.claude-plugin/plugin.json'))['version'])")
for f in .codex-plugin/plugin.json .cursor-plugin/plugin.json; do
  fv=$(python3 -c "import json;print(json.load(open('$f'))['version'])")
  [ "$fv" = "$v" ] || bad "$f version $fv != $v"
done

# 5. No dependency on retired integrations outside history docs.
hits=$(grep -rnE 'superpowers\.md|codex-plugin\.md|compozy\.md' --include='*.md' --include='*.json' --include='*.sh' --include='*.js' . \
       | grep -vE '^\./(docs/|CHANGELOG\.md|skills/)' || true)
[ -z "$hits" ] || bad "retired integration references:"$'\n'"$hits"

# 6. The installer's behaviour tests.
node --test tests/ >/dev/null 2>&1 || bad "node --test tests/ failed (run it for details)"

[ "$fail" -eq 0 ] && echo "batuta check: ok" || { echo "batuta check: FAILED"; exit 1; }
