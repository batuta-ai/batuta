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

# Every invalid input must leave both pin constants untouched.
cp "$tmp/install.js" "$tmp/before.js"
assert_rejected() {
  local fixture=$1 expected=$2 status=0
  output=$(INSTALL_JS="$tmp/install.js" scripts/pin-core.sh v0.0.0 --from "$fixture" 2>&1) || status=$?
  [[ $status -eq 1 ]]
  grep -q "$expected" <<<"$output"
  cmp -s "$tmp/before.js" "$tmp/install.js"
}

head -n 1 tests/fixtures/checksums.txt > "$tmp/partial.txt"
assert_rejected "$tmp/partial.txt" 'missing digest for batuta_darwin_arm64.tar.gz'

sed '/batuta_windows_amd64.zip/d' tests/fixtures/checksums.txt > "$tmp/missing.txt"
assert_rejected "$tmp/missing.txt" 'missing digest for batuta_windows_amd64.zip'

cp tests/fixtures/checksums.txt "$tmp/duplicate.txt"
head -n 1 tests/fixtures/checksums.txt >> "$tmp/duplicate.txt"
assert_rejected "$tmp/duplicate.txt" 'duplicated digest for batuta_darwin_amd64.tar.gz'

cp "$tmp/missing.txt" "$tmp/missing-duplicate.txt"
head -n 1 tests/fixtures/checksums.txt >> "$tmp/missing-duplicate.txt"
assert_rejected "$tmp/missing-duplicate.txt" 'batuta_darwin_amd64.tar.gz'
grep -q 'batuta_windows_amd64.zip' <<<"$output"

cp tests/fixtures/checksums.txt "$tmp/conflicting.txt"
head -n 1 tests/fixtures/checksums.txt | tr '1' 'a' >> "$tmp/conflicting.txt"
assert_rejected "$tmp/conflicting.txt" 'duplicated digest for batuta_darwin_amd64.tar.gz'

sed '1s/  / /' tests/fixtures/checksums.txt > "$tmp/malformed.txt"
assert_rejected "$tmp/malformed.txt" 'invalid checksum line'
