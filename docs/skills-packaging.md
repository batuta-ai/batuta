# Prepare a local skills package

This workflow assembles and checks a package archive on the local machine. It
does not publish the package or change any release, registry or catalog state.

## Requirements

- Node.js 22
- `git`
- `npm`

Run the commands from a clean Batuta source checkout. The assembler reads the
skills revision and digest from `skills-lock.json`, fetches that exact revision
and writes only the runtime allowlist into a new destination.

```bash
package_parent=$(mktemp -d)
package_dir="$package_parent/package"
archive_dir="$package_parent/archives"
mkdir "$archive_dir"

node scripts/assemble-package.js --output "$package_dir"
node scripts/check-artifact.js "$package_dir"
node -e 'const assert = require("node:assert/strict"); const fs = require("node:fs"); const marker = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); assert.deepEqual(marker, { schemaVersion: 1, status: "ready" })' "$package_dir/package-ready.json"
(cd "$package_dir" && npm pack --ignore-scripts --json --pack-destination "$archive_dir")
```

The output path must be absolute, outside the source checkout and absent when
assembly starts. `package-ready.json` is written last, after runtime validation.
Treat its exact `{ "schemaVersion": 1, "status": "ready" }` value as a
precondition for packing.

If assembly is interrupted or fails after reserving the destination, the
incomplete directory is preserved for inspection and has no ready marker. Do
not pack it or retry over it. After inspecting or removing it, run the assembler
again with a fresh destination. The assembler also refuses a malformed ready
marker because it never reuses an existing destination.

To validate an extracted archive, keep using the validator from the source
checkout:

```bash
node scripts/check-artifact.js /absolute/path/to/extracted/package
```

Extraction should reject absolute paths, traversal, links and special files
before writing archive contents. The package tests perform that safe extraction
and compare two independently generated archive files byte for byte.
