# Plan — Skills package assembly, phase 1
<!-- inputs: profile.md@sha256:4c7436960cc4 routing.md@sha256:b8b88f905e1c -->

**Goal:** Build and verify an independently assembled runtime package from the pinned skills dependency, without changing installed behavior or public distribution. This phase produces the assembler and artifact validation; publication and removal of tracked skills are separate deliveries.
**Created:** 2026-09-10 · **Status:** done

## Tasks
- [x] 1. Separate source and runtime artifact validation — tooling/medium
      Scope: tests/check.sh, tests/artifact.test.js, scripts/check-artifact.js
      Accept: standalone runtime validator rejects malformed or incomplete fixtures and accepts valid fixtures → node --test tests/artifact.test.js; existing source gate remains green → bash tests/check.sh
- [x] 2. Assemble locked skills into a clean runtime staging directory — tooling/high
      Depends on: 1
      Scope: scripts/assemble-package.js, tests/assemble-package.test.js
      Accept: exact revision, digest and output safety contracts pass offline fixture tests → node --test tests/assemble-package.test.js; no existing behavior regression → bash tests/check.sh
- [x] 3. Verify packed artifact and document local build workflow — tooling/medium
      Depends on: 1, 2
      Scope: tests/package.test.js, docs/skills-packaging.md, README.md, README.pt-BR.md
      Accept: real npm pack extraction and shared installation tests pass → node --test tests/package.test.js; complete project gate passes → bash tests/check.sh; English and Portuguese instructions match implemented commands and explicitly exclude publication → git diff --check

## Decisions and context

Use Batuta delegation, sequential execution, TDD, isolated worktrees and independent review per task. Routing predicts codex/gpt-5.6-sol for medium and codex/gpt-6-astra for high. User approved this plan on 2026-09-10. This is not permission to publish, merge, change repository rules or remove generated files. One approval remains required for PRs; previous PR82 admin exception does not carry forward. Archived cli and all sibling repos are out of scope.

Spec/evidence: `.batuta/runs/2026-09-10-skills-packaging-study.md` and `skills-packaging-spike/` beside it. Those ignored records are local evidence, not prerequisites for CI; tests must create their own fixtures. Real npm payload install/update/downgrade/uninstall succeeded on Codex0.153.4 and Claude2.1.266. Basic feasibility does not prove full runtime behavior or minimum versions. Source was verified at QA integration HEAD df465d8; start execution from current main and reconcile intervening changes before editing.

Global constraints: Node22, CommonJS, standard library only. Do not change package version, private flag, marketplace sources, installer behavior/core pin, release workflow, skills lock or tracked skills tree. No network in ordinary node tests. No real home/config writes. Preserve all existing source checks. Existing Git-npx and native plugin installs continue working unchanged. A CLI command takes an explicit destination outside the source checkout; it must not silently overwrite any existing destination or follow symlinks.

**Task 1.** Export `validateArtifact(root)` from `scripts/check-artifact.js`; throw on invalid artifact, return normally on success. CLI `node scripts/check-artifact.js <root>` exits 0/1, invalid arguments exit2. Validate JSON manifests, matching host/package versions, skills tree digest against lock, both command surfaces and targets, declared skills/hooks/scripts paths and runtime-required files. Reuse the existing command validator where safe, rather than inventing divergent routing syntax. Reject symlinks/special files, traversal and missing targets. Preserve the current lock digest algorithm byte-for-byte for ordinary files. The runtime validator must not require tests, release-please config or Git metadata. `tests/check.sh` retains source-only release-config and retired-reference checks and invokes runtime validation for the source checkout; extra source files are allowed by this validator. Package contents allowlisting belongs to task2/3, not the shared validator. First test a valid fixture without release config, then mutate manifest JSON, versions, target files and digest one at a time; each must fail for the named reason.

**Task 2.** Export async `assemblePackage({repoRoot, outputDir, fetchSkills})`. Production default `fetchSkills({commit, destination})` uses git init/fetch of `https://github.com/batuta-ai/skills.git` at the exact 40-hex lock commit, verifies fetched HEAD, and returns checkout root. Tests inject a local fixture fetcher; do not run user-controlled shell strings. Use bounded subprocess timeouts and argument arrays. Validate lock source/path/ref/commit/hash shapes before fetching; ref is descriptive, never the resolution authority. OutputDir must not exist, lie inside repoRoot or overlap fetched source; resolve parent symlinks before containment checks. User approved the following adjustment on 2026-09-10: reserve output with exclusive directory creation, populate non-atomically, validate completed payload, then write deterministic package-ready.json last (schemaVersion: 1, status: ready). No rename over the destination. A missing ready marker means incomplete, never consumable; failures report the incomplete destination, preserve it for inspection and require a new destination on retry. Clean owned fetch/staging temp files, not uncertain destination contents. Concurrent assembler invocations must never overwrite another writer; hostile external replacement of parent directories is outside the cooperative-writer contract. Reject pre-existing links and unsafe paths. Do not claim atomic directory publication.

**Task 2.** Runtime allowlist: package.json, LICENSE, README.md, README.pt-BR.md, bin/install.js, commands/, hosts/opencode/commands/, hooks/hooks.json, scripts/session-start.sh, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, .codex-plugin/plugin.json, .cursor-plugin/plugin.json, .cursor-plugin/marketplace.json, .agents/plugins/marketplace.json, skills-lock.json, and fetched skills/. Do not copy all scripts/, host skills/, .batuta/, Git data, tests, WORK or source release configuration. Keep current native catalogs unchanged during phase1. Write deterministic `package-provenance.json` containing schemaVersion1, host commit, skills commit and tree digest; no timestamps, absolute paths or secrets. Pass artifact validation before publishing the destination. CLI `node scripts/assemble-package.js --output <absolute-directory>` resolves repository root from script location, prints output path on success, exits nonzero with a specific error on failure. Prove source tree/lock bytes unchanged on success and failure; tests cover wrong commit, wrong digest, fetch failure, malformed lock, symlink/special file, existing destination, partial copy failure, and two independent outputs with identical file bytes.

**Task 3.** Create a temporary source fixture from current tracked runtime files, inject exact local skills via the assembler API, then run real `npm pack --ignore-scripts --json --pack-destination <temp>` twice outside the payload directory. Extract both artifacts safely, check every entry against the allowlist plus provenance and package-ready.json, require valid ready marker before packing, compare digests, invoke `validateArtifact` on the extracted package without supplemental release metadata. Do not loosen validation to make packaging pass. Exercise extracted `bin/install.js` shared installation through its existing exported function with explicit temporary paths: initial install, repeated install, preservation of modified QA skill and explicit force replacement. Assert source/shared files outside owned targets remain unchanged. No Claude/Codex session invocation, npm publish, real credentials or global installation. Tests must fail for leaked `.batuta`/tests/WORK content or omitted QA skill. Commands in docs: assembler CLI above, npm pack from output, artifact validator from source; explain local preparation only and Node22/git/npm requirements. Run the full gate, independent review, then one atomic commit per task through Batuta.

## Verification examples

Tests use node:test and node:assert/strict. Fixture helpers are defined in the owning test file, not imported from ignored research scripts. The following assertion shapes define the key contracts:

```js
assert.doesNotThrow(() => validateArtifact(runtimeFixture));
assert.throws(() => validateArtifact(missingSkillFixture));
await assert.rejects(assemblePackage({ repoRoot, outputDir: existingDir, fetchSkills }));
assert.deepEqual(await fs.readFile(firstArchive), await fs.readFile(secondArchive));
assert.match(await fs.readFile(customizedSkill, 'utf8'), /LOCAL CUSTOMIZATION/);
```

For every task: write its failing fixture assertion, run its named node test and record red; implement the narrow change, rerun green; run the full gate; independent review; commit only its scoped files. Suggested commit subjects: `refactor(validation): separate runtime artifact checks`, `feat(packaging): assemble pinned skills dependency`, `test(packaging): verify assembled npm payload`.

## Later delivery checkpoints (not executable tasks in this plan)

After phase1, settle npm namespace/ownership and publishing authentication; verify supported client versions and Cursor native marketplace scope. Then test real Git catalog refresh, complete Batuta runtime, corruption/unavailable registry and mixed-version rollback before publishing/promotion changes. Keep artifacts available before pointing catalogs at them. Only a later explicitly approved contraction removes tracked skills and changes developer hydration. Rollback of phase1 is reverting its commits: existing installed distribution never changes.

## Delivery verification
All three tasks implemented locally. Node22.23.2/npm10.9.8 and Node26.8.1/npm11.19.0 passed68 tests. Use explicit tests/*.test.js: Node22 does not accept directory-only test invocation. No publication, push, merge or vendor removal.

## Rollback decision — 2026-09-10
User requested selective reversal after complexity review. Goal is independent skills-only/plugin consumption, not removal of generated copies at any cost. Product packaging additions reverted in 0eb7cc5. This completed plan is historical and must not be resumed. Preserve Node22 explicit test glob, current version/release history and QA integration. No npm migration planned.
