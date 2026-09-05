#!/usr/bin/env bash
# Vendor the Batuta skills from batuta-ai/skills at a pinned tag.
# Mutating: rewrites skills/ and skills-lock.json. Usage: scripts/sync-skills.sh [tag]
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="https://github.com/batuta-ai/skills.git"
TAG="${1:-$(python3 -c 'import json;print(json.load(open("skills-lock.json"))["ref"])' 2>/dev/null || echo v0.4.0)}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git clone -q --depth 1 --branch "$TAG" "$REPO" "$tmp/skills"
commit=$(git -C "$tmp/skills" rev-parse HEAD)
rm -rf skills
mkdir -p skills
cp -R "$tmp/skills/skills/." skills/
hash=$(cd skills && find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256 | cut -c1-64)
cat > skills-lock.json <<JSON
{
  "source": "github.com/batuta-ai/skills",
  "ref": "$TAG",
  "commit": "$commit",
  "path": "skills",
  "computedHash": "sha256:$hash"
}
JSON
echo "skills vendored from $TAG ($commit)"
echo "commit as: fix(skills): vendor batuta-ai/skills $TAG  — a chore commit does not trigger a release"
