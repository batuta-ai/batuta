# WORK — batuta (host)

## Current status — 2026-10-14: v0.7.5, core beta.54, skills v0.16.0
- [x] batuta#121 vendors skills v0.16.0 (skills#78: `batuta-init` asks where `batuta loop` puts task worktrees and writes `Worktree-home: repository | cache`, default `cache` for JavaScript and TypeScript projects; a new first-run step keeps the project's test runners, linters and type checkers out of `.batuta/`) → v0.7.5. The maintainer machine runs plugin 0.7.5, core beta.54 and skills v0.16.0.
- [ ] No host command or skill names `batuta loop --prune` yet, and the conductor cycle (`skills/batuta/references/worktree.md`) keeps its worktrees in `.batuta/worktrees/`: its packet sits at the 9500-token budget.
- [ ] Still open from Tempo finding 4.4: stop processes whose working directory is inside a removed worktree (own plan in batuta-ai/core), and `batuta doctor` detecting tools that scan `.batuta/`.

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
