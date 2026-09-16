---
name: batuta
description: Conduct a code task without writing the code — classify, route to the cheapest capable executor, brief, delegate, verify, commit. Use for any delegable feature, bugfix, refactor or config change, and for "where does X live" questions. Not for setup, long plans or unattended runs.
---

# Batuta — the conducting cycle

> The conductor directs; the executor writes.

Keep host-tool names out. “Runtime question/background facility” means the
current host's equivalent; without one, ask and stop, or run foreground.

## Step 0 — Gates

1. No `.batuta/profile.md` → say “run /batuta-init” and stop; never onboard inline.
2. Handoff exists → say “paused work from <date> — /batuta-resume, or I continue with the new request”; obey, never auto-resume.
3. Batuta question → read the owning file; never answer from memory.

*Done when:* the profile is read and the handoff question is settled.

## Step 1 — Classify and route

1. Read `.batuta/routing.md` (project copy) — fall back to `references/routing.md`.
2. Classify **domain × complexity**: `low | medium | high | critical`. Self-sufficient brief → high; conversation, security judgment or open decisions → critical. In doubt, critical.
3. Announce in one line: `→ codex/gpt-5.6-sol: medium backend — <title>`.
4. User override wins.
5. Without `Dispatch: auto`, check adapter `available`; unavailable → next row. Auto defers to Step 3.
6. Ambiguous → `references/method/clarify.md`. Multi-session → suggest `/batuta-plan`, never require it.

*Done when:* every deliverable has lane, executor and model announced.

## Step 1.5 — Decompose

A task is the smallest deliverable that verifies and commits on its own.

1. Plural scope → one full-cycle task per deliverable.
2. Classify each task (Step 1). Order by dependency; independent items keep list order.
3. Announce `1/6 → opencode/kimi: low frontend — Card`; start immediately.
4. Declare inseparable items as one task.
5. Sequential unless profile/user says parallel; follow `references/worktree.md`. Verify and commit per item.

*Done when:* an ordered list exists, each item with a lane.

## Step 2 — Brief

**STOP. Read `references/brief.md` in full before the first brief of this session.**

- Always: Goal · Context · Conventions · Acceptance criteria · Boundaries · Scope · Expected evidence · Stop conditions. Empty → `Unknown — <reason>`.
- Conventions = profile + stack template + its `Extends` chain.
- Discovery context → `references/scout.md`; do not inspect when a scout lane exists.
- Batch: build Context/Conventions once and reuse.

*Done when:* the brief passes the checklist at the end of `brief.md`.

## Step 3 — Delegate

**STOP. Read `references/dispatch.md` before transport.** Route first; absent
`Dispatch:` stays CLI, while `Dispatch: auto` must pass native eligibility.

1. Per `dispatch.md`, select/check transport; invoke only its facility/adapter with model flags.
2. `self` (critical only) → implement test-first; bugs use `references/method/debug.md`; then Step 4.
3. `Worktree: off | medium+ | always` → `references/worktree.md`.
4. Parallel items run through the runtime's background facility; otherwise foreground.
5. Preflight: clean tree except managed state, or fresh worktree; test known. If core is on PATH, `batuta doctor`.

*Done when:* the executor finished and its receipt is captured.

## Step 4 — Verify

**STOP. Read `references/verification.md` in full before the first verdict of this session.**

In order: scope → diff (traceability/slop) → tests you run outside the executor → each criterion's proof. Executor reports are not evidence.

- Fail → file:line + command output, then **one retry**.
- Fail again → **escalate** one row, enriching the brief. Critical bugfix or post-escalation failure uses `references/method/debug.md` first.
- Failed-after-escalation batch item is skipped; report and block dependents.

*Done when:* verdict ✅ or ❌ with one proof line per criterion.

## Step 5 — Commit and record

1. One verified task = one methodology-compliant commit. Include pending managed state; in worktrees squash per `references/worktree.md`.
2. Add one `WORK.md` line and run trail per `references/state.md`: executor, model, retries, escalation. Commit with next task or `/batuta-pause`.

*Done when:* the commit sha is on the `WORK.md` line and the trail file exists.

## Never

1. Write product code for non-`critical` tasks.
2. Skip Step 4, even in a hurry.
3. Turn `WORK.md` into a schema. Prose and checkboxes.
4. Argue with a user route.
5. Write beyond managed state and produced code. Agent instruction files stay read-only unless requested.
