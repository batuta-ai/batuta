# WORK — batuta (host)

## In progress
- [ ] Skills package assembly phase1 approved; task1 verified and integrated as76f7c1a; task2 adjustment approved: exclusive output creation and ready marker after validation; resumed with codex/gpt-6-astra; task3 pending dependency. Branch `feat/skills-package-assembly`. No publication authorized.
- QA host PR82 merged as ebd2174 with explicitly authorized admin exception; host0.5.3 release commit a8c63b3 is now the packaging base.

## Follow-ups
- The retired-integration scan in tests/check.sh traverses nested excluded worktrees and misclassifies their historical documentation. Normal completed-worktree cleanup removes this false positive; a separate gate fix should respect repository scope.

## Done
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
