# WORK — batuta (host)

## Current status — 2026-10-29: v0.7.12 published and installed
- [x] User-authorized host PR#142 merged as `399cc69` after required CI `40938242822` passed; main CI `40938351056` passed. Release PR#143 published host/plugin v0.7.12 at `87c01b2`; release CI `40938438308` and release-please `40938438461` passed. Core is pinned to v1.1.0-beta.61 and skills to v0.17.2.
- [x] Official installer from immutable tag checkout `.batuta/worktrees/local-install-v0.7.12` exited 0 for detected Claude/Codex/OpenCode/Antigravity. Claude and Codex plugins are enabled at 0.7.12. All 14 skill trees in shared, Claude and Codex installations match published source; all 14 OpenCode commands match. Shared lock is v0.17.2 at `bb7827f`; PATH core reports beta.61 and its binary matches the verified official archive (SHA-256 `9ce7e86759892e365aabcf8c4c4c3729901d4880af596e91d840b6694b616ce5`). No forced skill overwrite, route changes, or unrelated worktree cleanup. Reopen agent sessions to load updated plugins. Evidence: parent host checkout `.batuta/runs/release-core61-skills0172/installed-verification.json` and `trail.md`.

## Historical checkpoint — 2026-10-29: release bundle verified locally
- [x] Core `v1.1.0-beta.61` and skills `v0.17.2` pinned through the official scripts; commit `ac0e039`, branch `fix/release-core61-skills0172`, base `40dd7fd`. Routed infra/medium to codex/gpt-5.6-sol; one implementation retry supplied parent-verified checksums after sandbox DNS failed. An earlier empty-effort dispatch failed before model execution; no route escalation. Parent host gate, all 40 Node tests, scope/diff, five published archive digests, exact 64-file skills tree, list/dry-run, and disposable native core plus 14-skill installation passed. Independent agy/gemini-3.8-flash-low review: 3/3 DONE, no code findings; corrected one evidence-path citation. Trail: `.batuta/runs/release-core61-skills0172/trail.md` in the parent host checkout.
- [x] Publication and official local upgrade completed after separate user authorization; see the current status above. The local-only checkpoint is retained as historical evidence.

## Current status — 2026-10-29: v0.7.11 installed, skills v0.17.1, core beta.58
- [x] Host#139 (`c66a9a7`) vendors skills v0.17.1 (`ddc8417`, skills#84/release#85) through the official script. Host#140 published v0.7.11 (`d257980`); merge and release CI/workflows passed. Exact64-file published source comparison, host gate and all40 Node tests passed. Core remains beta.58; skills cycle packet remains9499/9500.
- [x] The authorized official installer ran from immutable v0.7.11 checkout and exited0. Claude updated0.7.9→0.7.11; Codex updated0.7.10→0.7.11; shared skills updated0.16.1→0.17.1. All14 skill trees in shared/Codex/Claude locations match source, all14 OpenCode commands match, shared lock matches `ddc8417`, and PATH core beta.58 verified. Reopen agent sessions to load plugins. Evidence: `.batuta/runs/worktree-lifecycle-publication/` in the delivery worktree; immutable installer checkout `.batuta/worktrees/local-install-v0.7.11` under batuta-host-pin.

## Current status — 2026-10-26: v0.7.9, core beta.58, skills v0.16.1
- [x] batuta#133 pins core `v1.1.0-beta.58` (core#180: `batuta loop --answer` can carry a standing grant with `--allow-path` and `--allow-op`. The runner answers a later question that the grant covers and does not park again; boundary paths such as `WORK.md`, `.batuta/**`, CI configuration, licenses and lockfiles never pass through a grant) → v0.7.9. The maintainer machine still runs plugin 0.7.8 and core beta.57 until it is updated.
- [x] Worktree home and prune guidance are included in the v0.17.1 packaging above; no new host command is needed.
- [ ] The host skills do not yet tell the conductor how to write a grant. Through batuta-ai/skills.

## Status — 2026-10-24: v0.7.8, core beta.57, skills v0.16.1
- [x] batuta#130 vendors skills v0.16.1 (skills#80: the TypeScript and Biome rows of `skills/batuta-init/references/tool-ignores.md` now apply the same rules as `batuta doctor`. TypeScript `include` wildcards skip dot-directories, so tsconfig needs an edit only when `include` or `files` names `.batuta` itself. For Biome v2, the negated pattern comes after the positive ones and `.batuta` is written as a whole segment; `biome.jsonc` is read too.) → v0.7.8. The maintainer machine runs plugin 0.7.8, core beta.57 and skills v0.16.1.
- [x] The `--prune` item moved to the current status above.

## Status — 2026-10-22: v0.7.7, core beta.57, skills v0.16.0
- [x] batuta#127 pins core `v1.1.0-beta.57` (core#176: `batuta doctor` reports which project tools would scan `.batuta/`, namely Vitest, Jest, Playwright, ESLint, Prettier, Biome, TypeScript and pytest, each with a status and a hint, in text and in `--json`; it only reports, and `/batuta-init` does the patching) → v0.7.7. The maintainer machine still runs plugin 0.7.6 and core beta.56 until it is updated.
- [x] The `--prune` item moved to the current status above.
- [x] The TypeScript and Biome rows of `tool-ignores.md` were corrected in skills#80 (v0.16.1) and vendored in batuta#130; see the current status above.

## Status — 2026-10-16: v0.7.6, core beta.56, skills v0.16.0
- [x] batuta#124 pins core `v1.1.0-beta.56` (core#174: before batuta removes a worktree, during loop integration or abort and with `batuta loop --prune --apply`, it stops the processes whose working directory is inside it; the loop reports, trails and journals only the stops it confirmed) → v0.7.6. The maintainer machine runs plugin 0.7.6, core beta.56 and skills v0.16.0.
- [x] Tempo finding 4.4 is complete: `batuta doctor` tool detection shipped in core beta.57; see the section above.

## Status — 2026-10-14: v0.7.5, core beta.54, skills v0.16.0
- [x] batuta#121 vendors skills v0.16.0 (skills#78: `batuta-init` asks where `batuta loop` puts task worktrees and writes `Worktree-home: repository | cache`, default `cache` for JavaScript and TypeScript projects; a new first-run step keeps the project's test runners, linters and type checkers out of `.batuta/`) → v0.7.5. The maintainer machine runs plugin 0.7.5, core beta.54 and skills v0.16.0.
- [x] Process cleanup from Tempo finding 4.4 shipped in core beta.56; see the section above.

## Status — 2026-10-14: v0.7.4, core beta.54, skills v0.15.1
- [x] batuta#118 pins core `v1.1.0-beta.54` (core#170: profile line `Worktree-home: repository | cache`, which can keep task worktrees in the user cache directory outside the repository, and `batuta loop --prune [--apply]` for orphaned batuta worktrees) → v0.7.4. The maintainer machine runs plugin 0.7.4, core beta.54 and skills v0.15.1.
- [x] Part (a) of Tempo finding 4.4 shipped in skills v0.16.0; see the section above.

## Status — 2026-10-13: v0.7.3, core beta.53, skills v0.15.1
- [x] batuta#111 pins core `v1.1.0-beta.52` (loop briefs carry the profile's `## Conventions`, core#165) → v0.7.1.
- [x] batuta#113 vendors skills v0.15.1 (skills#76 fixes the `check.sh` defect of skills#75) → v0.7.2.
- [x] batuta#115 pins core `v1.1.0-beta.53` (`batuta loop --recover` and `--reconcile`, core#168) → v0.7.3.
- [ ] No host command or skill names `--recover` or `--reconcile` yet. The `batuta-loop` skill is the place for it, through batuta-ai/skills.
- [ ] The `In progress` and `Next focus` sections below date from v0.6.1 and need a review.

## In progress
- Post-rollback cleanup verified locally; awaiting cleanup PR integration. Host v0.6.1 is released; rollback PR86 merged as 8d66a51. No npm migration.

## Next focus
- Improve Batuta subagent dispatch after cleanup: investigate per-CLI capabilities, instructions and fallback before proposing implementation. Separate delivery, not started.

## Done
- [x] Repository-aware retired-reference scan → codex/gpt-5.6-sol, one fixture-cleanup retry, commit 2ecbb05. Conductor39 tests on Node22/26; agy3 criteria DONE/no findings.
- [x] v0.6.1 installation smoke: real Claude/Codex Git marketplace installs and separate shared-skills-only installer path passed in disposable homes; QA bytes verified, no global installations changed.
- [x] Selective rollback of PR84 packaging → codex/gpt-5.6-sol, first attempt, commit 0eb7cc5. Conductor exact pre-PR README/gate equality, nine-path scope, unchanged QA/installers/manifests and36 tests on Node22/26 verified. Plan archived as historical/reverted.
- [x] Package fixture Git maintenance race → codex/gpt-5.6-sol, first attempt, commit d404341; conductor package tests3 runs plus69 tests on Node22/26. PR84 opened; no merge/publication. Trail: `.batuta/runs/package-fixture-race.md`.
- [x] Package task3 packed artifact tests/docs → codex/gpt-5.6-sol, one independent-allowlist retry, commit dd91438. Conductor68 tests on Node22 and26; agy all4 criteria DONE/no findings. Phase1 complete locally, no publishing.
- [x] Package task2 exclusive assembler → codex/gpt-6-astra high, approved contract adjustment then first implementation attempt, commit 8a99a8b. Independent64 tests, real source fetch and agy review all4 criteria DONE/no findings.
- [x] Package task1 runtime validation → codex/gpt-5.6-sol, one test-hygiene retry, no escalation, commit 76f7c1a. Independent 47 tests passed; agy/gemini-3.8-flash-low three criteria DONE, no findings.
- [x] QA host integration: vendor skills v0.8.0 through sync-skills.sh, four qa-plan/qa-run wrappers, README mirrors, and multi-segment command validation with four red-green regressions. Codex/gpt-5.6-sol, first attempt, commit 3159059. Independent host gate and 36 tests passed; agy/gemini-3.8-flash-low review returned SHIP with no findings. Trail: `.batuta/runs/2026-09-10-qa-host.md`.
- [x] installer review fixes 2: unambiguous tree hash, root entry via lstat, archive deadline and multi-chunk cap tests → codex (codex/gpt-6-astra), primeira tentativa, commit c661f69 em feat/installer-hardening (trail: .batuta/runs/2026-09-08-review-fixes-2.md)
- [x] installer review fixes: symlink-safe hashes, cancelled bodies, strict pin-core parser, isolated cleanup test, discoverable shell test → codex (codex/gpt-5.6-sol), primeira tentativa, commit 217cf66 em feat/installer-hardening (trail: .batuta/runs/2026-09-08-review-fixes.md)
- [x] README: the ownership guarantee is qualified for locks without hashes (review round 4 minor) → conductor, docs only
- [x] install.js --help e flag desconhecida (#57) → codex (codex/gpt-5.4-mini), primeira tentativa, commit 8e03c2d em fix/install-help (trail: .batuta/runs/2026-09-06-install-help.md)
- [x] Download deadline, archive size cap and cleanup on every failure path → codex (gpt-5.6-sol), commit f493802939b8 (trail: .batuta/runs/2026-09-08-installer-hardening-task-1.md, delivery installer-hardening-20260908-180953, plan installer-hardening, 2026-09-08)
- [x] Download deadline, archive size cap and cleanup on every failure path → ticked in the plan before the run, commit b51d9f145d61 (trail: .batuta/runs/2026-09-08-installer-hardening-task-1.md, delivery installer-hardening-20260908-182314, plan installer-hardening, 2026-09-08)
- [x] Per-platform digests pinned in the installer, cross-checked with the release's checksums.txt, refreshed by scripts/pin-core.sh → codex (gpt-5.6-sol), commit feba68ddba7a (trail: .batuta/runs/2026-09-08-installer-hardening-task-2.md, delivery installer-hardening-20260908-182314, plan installer-hardening, 2026-09-08)
- [x] Windows: the installer downloads batuta_windows_amd64.zip and installs batuta.exe → codex (gpt-5.6-sol), commit 86d8f92c3a6c (trail: .batuta/runs/2026-09-08-installer-hardening-task-3.md, delivery installer-hardening-20260908-182314, plan installer-hardening, 2026-09-08)
- [x] Ownership contract for the shared skills: customized copies are kept with a warning, --force-skills replaces them, the README says who owns what → codex (gpt-5.6-sol), commit 4fd8560e7cc3 (trail: .batuta/runs/2026-09-08-installer-hardening-task-4.md, delivery installer-hardening-20260908-182314, plan installer-hardening, 2026-09-08)
- [x] PRD-v1.md in English: the historical PRD is translated in place, structure intact → codex (gpt-5.6-sol), commit a11b23a4205b (trail: .batuta/runs/2026-09-08-installer-hardening-task-5.md, delivery installer-hardening-20260908-182314, plan installer-hardening, 2026-09-08)
