---
name: batuta
description: Conduct a code task without writing the code — classify, route to the cheapest capable executor, brief, delegate, verify, commit. Use for any delegable feature, bugfix, refactor or config change, and for "where does X live" questions. Not for setup, long plans or unattended runs.
---

# Batuta — the conducting cycle

> The conductor does not play. You direct; the executor writes the code.

Names of host tools never appear here. "The runtime's question tool" and
"the runtime's background facility" mean whatever the host you run in offers;
without one, ask in your message and stop, or run in the foreground.

## Step 0 — Gates

1. No `.batuta/profile.md` → say "run /batuta-init" and stop. Never onboard inline.
2. `.batuta/handoff.md` exists → one line: "paused work from <date> — /batuta-resume, or I continue with the new request". Obey the answer. Never auto-resume.
3. The request is about Batuta itself → read the file that owns the answer, then reply. Never from memory.

*Done when:* the profile is read and the handoff question is settled.

## Step 1 — Classify and route

1. Read `.batuta/routing.md` (project copy) — fall back to `references/routing.md`.
2. Classify **domain × complexity**: `low | medium | high | critical`. High vs critical is the brief test: fully specifiable in a self-sufficient brief → high; needs the conversation, security judgment or open decisions → critical. In doubt → critical.
3. Announce in one line: `→ codex/gpt-5.6-sol: medium backend — <title>`.
4. The user's override ("use kimi") wins, no discussion.
5. Availability: run the adapter's `available` command (`adapters/<executor>.md`). Unavailable → next row up, say so.
6. Ambiguous request → `references/method/clarify.md`. Work spanning sessions → suggest `/batuta-plan`. A plan is never a prerequisite.

*Done when:* every deliverable has lane, executor and model announced.

## Step 1.5 — Decompose

A task is the smallest deliverable that verifies and commits on its own.

1. Plural scope ("X, Y and Z", a list, N components) → N tasks, each with its own full cycle.
2. Classify each task (Step 1). Order by dependency; independent items keep list order.
3. Announce one line per item — `1/6 → opencode/kimi: low frontend — Card` — and start the first cycle at once. No confirmation stop.
4. Coupled items that cannot verify separately stay one task, declared as such.
5. Mode: sequential by default. Profile `Execution: parallel` or the user's ask → parallel per `references/worktree.md`. Verify and commit stay per item.

*Done when:* an ordered list exists, each item with a lane.

## Step 2 — Brief

**STOP. Read `references/brief.md` in full before the first brief of this session.**

- Sections, always: Goal · Context · Conventions · Acceptance criteria · Boundaries · Scope · Expected evidence · Stop conditions. Empty section → `Unknown — <reason>`.
- Conventions = `.batuta/profile.md` + its stack template + the template's `Extends` chain (`templates/`).
- Context that needs discovery ("where is X handled?") → the scout, `references/scout.md`. Do not read the codebase yourself when a scout lane exists.
- Batch: build Context and Conventions once, reuse across the batch's briefs.

*Done when:* the brief passes the checklist at the end of `brief.md`.

## Step 3 — Delegate

1. Invoke per the adapter's `run` line (`adapters/<executor>.md`), with the row's model flags. A delegation without them is a routing bug.
2. `self` adapter (critical only) → you implement: test-first from the criteria; bugs via `references/method/debug.md`; then Step 4 like any executor.
3. Profile `Worktree: off | medium+ | always` → `references/worktree.md` decides where the executor works.
4. Parallel items run through the runtime's background facility; otherwise foreground.
5. Preflight before spending tokens: clean tree (or fresh worktree), test command known. With the core binary on PATH, `batuta doctor`.

*Done when:* the executor finished and its report is captured verbatim.

## Step 4 — Verify

**STOP. Read `references/verification.md` in full before the first verdict of this session.**

Always, in order: scope check → diff review (traceability, slop) → tests run by you, outside the executor's session → criteria one by one, each with its proof re-run. The executor's report is never evidence.

- Fail → specific feedback (file:line, failing command output) + **one retry**.
- Fail again → **escalate** one row up; re-brief enriched with what was learned. Critical bugfix or post-escalation failure → `references/method/debug.md` first.
- Batch: a task that fails after escalation is skipped; dependents are blocked and reported, never run blind.

*Done when:* verdict ✅ or ❌ with one proof line per criterion.

## Step 5 — Commit and record

1. One verified task = one commit, message per the profile's methodology. In a worktree, squash per `references/worktree.md`.
2. One `WORK.md` line and one run trail, format in `references/state.md`. The line tells the routing story: executor, model, retries, escalation.

*Done when:* the commit sha is on the `WORK.md` line and the trail file exists.

## Never

1. Write product code for `low`, `medium` or `high` tasks.
2. Skip Step 4, even in a hurry.
3. Turn `WORK.md` into a schema. Prose and checkboxes.
4. Argue with the user's routing choice.
5. Write outside `WORK.md`, `.batuta/` and the code the cycle produces. `CLAUDE.md`, `AGENTS.md` and other tools' files are read-only unless the user asks.
