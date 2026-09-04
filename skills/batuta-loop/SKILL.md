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

1. **Preflight.** `command -v batuta` — absent → say the core binary is missing, give the install line from the README, offer the interactive cycle instead. Then `batuta doctor`: hosts, adapters, test command, skills version.
2. **Pick the plan.** The user names it or there is exactly one `.batuta/plan-*.md` with `Status: approved`. A plan not approved → stop; approval happens in `/batuta-plan`.
3. **Dry run.** `batuta loop --dry-run .batuta/plan-<slug>.md` prints the waves (dependency-safe, at most four tasks each), the executor and model per task, the worktrees it would create, the test command. Show it. Any preflight failure (dirty tree, unknown test command, unavailable executor) stops here — nothing has been spent.
4. **Launch.** `batuta loop .batuta/plan-<slug>.md` through the runtime's background facility, or tell the user to run it in another terminal. The run ends the turn: report the journal path (`.batuta/journal/<delivery>.jsonl`) and how to watch (`batuta loop --dashboard`).
5. **Questions from a task.** A task that hits a stop condition parks: journal `waiting_input`, question in `.batuta/asks/<task>.md`. Relay it to the user; the answer goes back with `batuta loop --answer <task> "<text>"` and the task resumes in its own worktree.
6. **Resume.** After an interruption, `batuta loop --resume <delivery>` replays the journal and continues from the last recorded operation. Completed tasks and their commits carry forward.
7. **Report exactly.** When the run ends, read `WORK.md` and the journal's terminal state — `done`, `blocked`, `exhausted`, `canceled` — and report it literally with commits, aborted tasks and blockers. Never round up to success.

*Done when:* the run reached a terminal state and the user saw it verbatim.

## What the loop never does

Merge to the default branch, push, approve its own gates, widen a Scope,
or continue past a task that failed escalation — dependents are blocked
and reported.
