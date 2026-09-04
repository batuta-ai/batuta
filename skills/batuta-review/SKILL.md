---
name: batuta-review
description: Verify any diff on demand with the cycle's Step 4 — scope, traceability, tests, criteria, optional second reviewer. Use for /batuta-review or when asked to review uncommitted changes, an executor's work or a range. Never changes code.
---

# Batuta review — verification on demand

**STOP. Read `../batuta/references/verification.md` in full before the
first verdict.** Its rules apply here unchanged: report ≠ evidence, scans
when the diff touches tests, slop in the diff review, the cross-review
contract when a second reviewer is dispatched.

## Procedure

1. **Target.** Default: uncommitted changes (`git diff` + `git diff --staged`). The user may name a range (`HEAD~3..`), a branch or a commit.
2. **Contract.** A brief with a Scope list associated (the trail in `.batuta/runs/` carries it verbatim) → scope check first. A plan or spec → include it verbatim in the review material. Nothing associated → derive the criteria from what the change appears to deliver, and say that you did.
3. **Diff review** as the conductor: correctness, traceability (drive-by edits are findings even when correct), conventions from `.batuta/profile.md` and its template, slop, workarounds.
4. **Tests.** The profile's test command, run by you. No profile → ask which command.
5. **Criteria**, one by one, each with its proof re-run.
6. **Second reviewer** when the user asks, or when the change is `high`/`critical`: any executor from the table through its `readonly` line, findings file outside the repo, lenses by diff size. Judge each finding with a one-line rationale.
7. **Verdict:** ✅ approved or ❌ rejected, findings as `file:line — problem — fix`, and the next step (fix via `/batuta`, commit, discard). A rejected finding you declined goes to `.batuta/learnings.md` as one rule, when it taught one.

*Done when:* the verdict lists one proof line per criterion and every finding has a location.

Read-only: no commits, no code changes, no delegation of code work.
