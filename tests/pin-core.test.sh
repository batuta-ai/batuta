#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp bin/install.js "$tmp/install.js"

output=$(INSTALL_JS="$tmp/install.js" scripts/pin-core.sh v9.8.7 --from tests/fixtures/checksums.txt)

grep -q 'const CORE_VERSION = "v9.8.7";' "$tmp/install.js"
grep -q '"batuta_darwin_amd64.tar.gz": "1111111111111111111111111111111111111111111111111111111111111111"' "$tmp/install.js"
grep -q '"batuta_darwin_arm64.tar.gz": "2222222222222222222222222222222222222222222222222222222222222222"' "$tmp/install.js"
grep -q '"batuta_linux_amd64.tar.gz": "3333333333333333333333333333333333333333333333333333333333333333"' "$tmp/install.js"
grep -q '"batuta_linux_arm64.tar.gz": "4444444444444444444444444444444444444444444444444444444444444444"' "$tmp/install.js"
grep -q '"batuta_windows_amd64.zip": "5555555555555555555555555555555555555555555555555555555555555555"' "$tmp/install.js"
grep -q '^commit as: fix(install): pin core v9.8.7$' <<<"$output"
