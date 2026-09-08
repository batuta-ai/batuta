#!/usr/bin/env bash
# Pin the Batuta core version and release asset digests in the installer.
# Usage: scripts/pin-core.sh <tag> [--from <checksums file>]
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -ne 1 && $# -ne 3 ]]; then
  echo "usage: scripts/pin-core.sh <tag> [--from <checksums file>]" >&2
  exit 2
fi

tag=$1
target=${INSTALL_JS:-bin/install.js}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

if [[ $# -eq 3 ]]; then
  if [[ $2 != "--from" ]]; then
    echo "usage: scripts/pin-core.sh <tag> [--from <checksums file>]" >&2
    exit 2
  fi
  checksums=$3
else
  checksums="$tmp/checksums.txt"
  curl -fsSL "https://github.com/batuta-ai/core/releases/download/$tag/checksums.txt" -o "$checksums"
fi

PIN_TAG="$tag" CHECKSUMS_FILE="$checksums" INSTALL_JS="$target" node -e '
const fs = require("node:fs");
const tag = process.env.PIN_TAG;
const checksumsFile = process.env.CHECKSUMS_FILE;
const installJs = process.env.INSTALL_JS;
const entries = fs.readFileSync(checksumsFile, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim().match(/^([0-9a-f]{64})\s+\*?(\S+)$/))
  .filter(Boolean)
  .map((match) => [match[2], match[1]]);
if (entries.length === 0) throw new Error(`${checksumsFile} contains no release asset digests`);
let source = fs.readFileSync(installJs, "utf8");
const versionPattern = /const CORE_VERSION = "[^"]+";/;
const checksumsPattern = /const CORE_CHECKSUMS = \{[\s\S]*?\n\};/;
if (!versionPattern.test(source) || !checksumsPattern.test(source)) {
  throw new Error(`${installJs} does not contain the expected core pin constants`);
}
const object = [
  "const CORE_CHECKSUMS = {",
  ...entries.map(([name, digest]) => `  ${JSON.stringify(name)}: ${JSON.stringify(digest)},`),
  "};",
].join("\n");
source = source.replace(versionPattern, `const CORE_VERSION = ${JSON.stringify(tag)};`);
source = source.replace(checksumsPattern, object);
fs.writeFileSync(installJs, source);
'

echo "core pins refreshed from $checksums"
echo "commit as: fix(install): pin core $tag"
