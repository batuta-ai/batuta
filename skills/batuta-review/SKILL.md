---
name: batuta-review
description: Review uncommitted work, a diff, range, branch, PR or delivery. Use for /batuta-review, `deep`, `review this branch` or `review this PR`. Routes eligible work through core `batuta review`; otherwise runs the manual verification. Read-only.
---

# Batuta review — verification on demand

**STOP. Read `../batuta/references/verification.md` in full before the
first verdict.** Its rules apply here unchanged: report ≠ evidence, scans
when the diff touches tests, slop in the diff review, the cross-review
contract when a second reviewer is dispatched.

## Procedure

1. **Target and probe.** Probe once per session with `batuta capabilities 2>/dev/null | grep -q '"review"'`. A branch, range or delivery with a green probe uses the engine. `deep` forces the engine when the probe is green. Uncommitted work, a diff of one or two files, or a failed probe uses the manual procedure.
2. **Engine.** Run `batuta review [--base <ref>] [--spec <plan>] [--worktree] [--cohort-files N] [--parallel N] [--reviewer <executor/model>] [--full] [--out <dir>]`.
3. **Tree.** `--base` defaults to the branch point. `--worktree` adds untracked, non-ignored files. The source tree must not change during the run, including conductor edits; otherwise it aborts with `source tree changed during review`.
4. **Specification.** `--spec <plan slug or path>` loads acceptance criteria. The review runs each proof in the reviewed tree; criteria without proofs receive a read-only sweep. A proof that changes the tree fails the review.
5. **Reviewers.** `--reviewer` overrides routing; otherwise the optional `review` role in `.batuta/routing.md` wins, then the general/high lane. `--parallel N` bounds concurrent sessions, default one; `--cohort-files N` sets cohort size, default eight files.
6. **Rounds.** State is incremental per branch and spec: later rounds review only work beyond the last covered checkpoint. `--full` ignores that state and reviews from `--base` again.
7. **Engine result.** Exit `0` means SHIP, `2` FIX_BEFORE_SHIP, `3` REWORK and `1` no report. Any blocker, violated criterion or incomplete coverage means REWORK; otherwise any major means FIX_BEFORE_SHIP; otherwise SHIP.
8. **Artefacts.** Keep `.batuta/reviews/<date>-<slug>/` out of git. It contains `review.md` (also printed to stdout), `findings.json`, `manifest.json` and `state.json`.
9. **Judge.** Engine findings and verdict are evidence, not the final call. Read `review.md`, judge every finding with a one-line rationale and own the verdict. A rejected finding goes to `.batuta/learnings.md` as one rule when it taught one.

## Manual procedure

1. **Target.** Default: uncommitted changes (`git diff` + `git diff --staged`). The user may name a range (`HEAD~3..`), a branch or a commit.
2. **Contract.** A brief with a Scope list associated (the trail in `.batuta/runs/` carries it verbatim) → scope check first. A plan or spec → include it verbatim in the review material. Nothing associated → derive the criteria from what the change appears to deliver, and say that you did.
3. **Diff review** as the conductor: correctness, traceability (drive-by edits are findings even when correct), conventions from `.batuta/profile.md` and its template, slop, workarounds.
4. **Tests.** The profile's test command, run by you. No profile → ask which command.
5. **Criteria**, one by one, each with its proof re-run.
6. **Second reviewer** when the user asks, or when the change is `high`/`critical`: any executor from the table through its `readonly` line, findings file outside the repo, lenses by diff size. Judge each finding with a one-line rationale.
7. **Verdict:** ✅ approved or ❌ rejected, findings as `file:line — problem — fix`, and the next step (fix via `/batuta`, commit, discard). A rejected finding you declined goes to `.batuta/learnings.md` as one rule, when it taught one.

*Done when:* the engine walkthrough was read and every finding judged, or the manual verdict lists one proof line per criterion; every finding has a location.

Reviewer sessions and this skill are read-only: no commits, no code changes, no delegation of code work.
