---
name: batuta-init
description: Set Batuta up in a project or change an existing setup — stack, methodology, commands, lanes and models, project map. Use for /batuta-init. Not for running tasks (batuta).
disable-model-invocation: true
---

# Batuta init — onboarding and reconfiguration

Mode is decided by `.batuta/profile.md`: absent → first run; present →
reconfigure. Read `../batuta/references/routing.md` first in both modes.

## First run

1. **Detect.** Stack from manifests (`package.json` deps, lockfiles, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`). Read `CLAUDE.md`/`AGENTS.md` if present: the profile complements them, never repeats them; a contradiction with the user's answers is flagged, never edited.
2. **Ask once**, all questions in one message:
   - Stack? (detected suggestion as default)
   - Methodology: TDD or tests after? Conventional commits or free-form? Trunk or feature branches?
   - Test command? Build command? Install command? (install is optional; prepares a worktree)
   - Batch execution: `sequential` (default) or `parallel`?
   - Worktree mode: `off`, `medium+` (default) or `always`?
3. **Inventory.** With the core binary on PATH: `batuta inventory` (redacted JSON of installed executors and their models). Otherwise, run `available` and `models` from each adapter the default table names — `../batuta/adapters/`. Never scan the machine for CLIs the table does not name; a new CLI enters only when the user asks for it.
4. **Propose the lanes** from what is installed, executor and exact model per row, research lane included. Filter cheap candidates with `kimi|deepseek|glm|qwen|flash|mini|nano|free`; suggest two or three per lane. Shapes:
   - full set → default table; confirm the `low` model and the `high` executor (codex strong model, or a strong Claude/Cursor model in background).
   - no codex → opencode keeps `low`, a mid-tier opencode model on `medium`, a strong background model on `high`.
   - one vendor only → lanes differ by model of that vendor's CLI adapter; `critical` stays `self`.
5. **Confirm once.** One question covering the whole mapping and the pointer (step 7). The user has the final word on every row.
6. **Write** `.batuta/profile.md` (answers as literal lines: `Stack:`, `Methodology:`, `Test:`, `Build:`, `Install:`, `Execution:`, `Worktree:`, `Template: templates/<stack>.md`) and `.batuta/routing.md` (the confirmed table, stamp on line 3 per `../batuta/references/state.md`). Template: the most specific that applies (`nextjs` > `react` > `generic`); in doubt, the child.
7. **Pointer (opt-in).** Offer to write `assets/agents-md-block.md` into the project's `AGENTS.md` between its markers. Declined → write nothing, never re-offer. Accepted → replace what sits between existing markers, or create the file with only the block. The last sentence of the block is the anti-loop guard for executors that read `AGENTS.md`.
8. **Takeover.** Artifacts from another framework (`.planning/`, `TODO.md`, roadmaps) → offer a one-time import: in-progress and done work become `WORK.md` lines, large remaining work becomes `.batuta/plan-<slug>.md`. Old artifacts stay untouched.
9. **Project map.** Add a "Project map" section to the profile: 20–40 lines of prose — key directories, where routes/components/tests live, entry points, generated files not to touch. Delegate the sweep to the research lane (`../batuta/references/scout.md`); no lane or two failures → sweep yourself. The map says where to start looking, not everything.
10. **`WORK.md`** at the project root if absent (format in `state.md`).
11. **Self-check**, then report:
    ```bash
    test -f .batuta/profile.md && test -f .batuta/routing.md && test -f WORK.md
    grep -q '^Test:' .batuta/profile.md
    sed -n 3p .batuta/routing.md | grep -q 'inputs: profile.md@sha256:'
    ```
    Any failure → fix and re-run. Never report done with a failing check.

*Done when:* the three files exist, every routing row names an installed executor with an exact model, the self-check is green.

## Reconfigure

1. Re-run `available` for every executor the project's table names. Never scan.
2. Recompute the routing stamp; show the current setup in a few lines: rows, profile answers, stamp state, map age.
3. **Migrate** a table still using `trivial/medium/complex/critical`: `trivial → low`, `complex → high`; add the Domain column with `*`. Say so.
4. Ask what to change — one question: a row or model, a profile answer, execution or worktree mode, the pointer (add, rewrite, remove between markers), a fresh map sweep.
5. Rewrite only what changed, reusing the first-run discovery and single confirmation for any lane change. Refresh the stamp. Never touch `WORK.md`.

*Done when:* the changed files are rewritten, the self-check above is green, and the user saw the resulting table.
