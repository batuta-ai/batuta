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
const assets = [
  "batuta_darwin_amd64.tar.gz",
  "batuta_darwin_arm64.tar.gz",
  "batuta_linux_amd64.tar.gz",
  "batuta_linux_arm64.tar.gz",
  "batuta_windows_amd64.zip",
];
const digests = new Map();
const errors = [];
for (const [index, line] of fs.readFileSync(checksumsFile, "utf8").split(/\r?\n/).entries()) {
  if (line === "") continue;
  const match = line.match(/^([0-9a-f]{64})  (batuta_(?:(?:darwin|linux)_(?:amd64|arm64)\.tar\.gz|windows_amd64\.zip))$/);
  if (!match) {
    errors.push(`invalid checksum line ${index + 1}: ${line}`);
  } else if (digests.has(match[2])) {
    errors.push(`duplicated digest for ${match[2]}`);
  } else {
    digests.set(match[2], match[1]);
  }
}
for (const asset of assets) {
  if (!digests.has(asset)) errors.push(`missing digest for ${asset}`);
}
if (errors.length > 0) {
  console.error(`${checksumsFile}: ${errors.join("; ")}`);
  process.exit(1);
}
const entries = assets.map((asset) => [asset, digests.get(asset)]);
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
