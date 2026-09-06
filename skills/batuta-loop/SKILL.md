---
name: batuta-loop
description: Run an approved plan unattended — the core binary conducts, executors implement in worktrees, gates verify, one commit per task. Use for /batuta-loop. Not for ad-hoc tasks (batuta) or writing the plan (batuta-plan).
disable-model-invocation: true
---

# Batuta loop — the mechanical conductor

`batuta loop` is the core binary (`batuta-ai/core`) driving the cycle over
a plan without a model in the conductor's seat: routing from the table,
one fresh executor session per task via its adapter, the four gates, fix
cycles with the real cause, escalation one row up, one commit per task,
`WORK.md` and trails written as it goes.

## Procedure

1. **Preflight.** `command -v batuta` — absent → say the core binary is missing, give the install line from the README, offer the interactive cycle instead. Then `batuta capabilities 2>/dev/null | grep -q '"loop"'` — fails → say "this core binary (`batuta version`) does not ship `loop` yet", offer the interactive cycle, stop. Then `batuta doctor`: hosts, adapters, clean tree, test command, skills version.
2. **Pick the plan.** The user names it or there is exactly one `.batuta/plan-*.md` with `Status: approved`. A plan not approved → stop; approval happens in `/batuta-plan`.
3. **Dry run.** `batuta loop --dry-run .batuta/plan-<slug>.md` prints the waves (dependency-safe, at most four tasks each), the executor and model per task with the fallbacks, the worktrees it would create, the test command. Show it. Any preflight failure (dirty tree, managed state uncommitted, no `Test:` line, unavailable executor, a task routed to `self`) stops here — nothing has been spent. Tasks on `self` run interactively through `batuta`; tick them, then loop the rest.
4. **Launch.** `batuta loop .batuta/plan-<slug>.md` through the runtime's background facility, or tell the user to run it in another terminal. The run ends the turn: report the journal path (`.batuta/journal/<delivery>.jsonl`) and how to watch (`batuta loop --dashboard`).
5. **Questions from a task.** An executor that must stop prints one final `BATUTA-QUESTION: <text>` line (the brief states the protocol); the task parks: journal `waiting_input`, question in `.batuta/asks/<slug>-<task>.md`, run ends with exit 3. Relay it to the user; `batuta loop --answer <task> "<text>"` records the answer and resumes the task in the same worktree.
6. **Resume.** After an interruption, `batuta loop --resume <delivery>` loads the journal and continues from the last recorded operation; an executor that was running becomes a same-worktree retry. Completed tasks and their commits carry forward. A delivery that will not continue closes with `batuta loop --abandon <delivery>`, which ticks what integrated; the branch must not receive other commits while a delivery is open.
7. **Report exactly.** When the run ends, read its summary, `WORK.md` and the journal's terminal state — `done` (exit 0), `blocked` (2), `waiting_input` (3), `canceled` (130), `abandoned` — and report it literally with commits, aborted tasks and blockers. `batuta trail <delivery>` lists every journal record. Never round up to success.

*Done when:* the run reached a terminal state and the user saw it verbatim.

## What the loop never does

Merge to the default branch, push, approve its own gates, widen a Scope,
override the routing table with a plan's `→ executor/model` hint, or
continue past a task that failed escalation — dependents are blocked and
reported. A usage limit is never a failure: the loop waits for the reset
and re-runs the same attempt.
