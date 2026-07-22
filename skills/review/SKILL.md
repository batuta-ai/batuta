---
name: review
description: Batuta's on-demand verification. Use when the user invokes /batuta:review or asks to review a diff, an executor's work, or uncommitted changes.
---

# Batuta — on-demand review

Re-runs the cycle's verification step over any diff, delegating nothing.

With superpowers installed, conduct the review with the rigor of
`requesting-code-review` and `verification-before-completion`
(plugin root `superpowers.md`, verification row); the steps and the verdict
below stay unchanged.

1. **Determine the target:** by default, uncommitted changes (`git diff` +
   `git diff --staged`); the user may point to a range (`HEAD~3..`), a branch or
   a commit.
2. **Diff review** — review as the maestro: correctness, scope, adherence to the
   conventions in `.batuta/profile.md` and the stack template. Traceability
   test: every changed line must trace to what the change set out to do — flag
   drive-by edits even when correct.
3. **Tests** — run the profile's test command (if there is no profile, ask which
   command to use).
4. **Acceptance criteria** — if a brief or plan is associated with the change,
   check item by item; otherwise derive criteria from what the change appears to
   deliver and make that explicit.
5. **Verdict** — ✅ approved or ❌ rejected, with an objective list of issues
   (file:line) and a suggested next step (fix via `/batuta`, commit, discard).

This skill neither commits nor changes code — it only evaluates and reports.
