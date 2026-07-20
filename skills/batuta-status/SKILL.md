---
name: batuta-status
description: Batuta status. Use when the user invokes /batuta:status or asks what is in progress, what is done, or how delegated background tasks are going.
---

# Batuta — status

1. Read the project's `WORK.md`. Missing → say Batuta hasn't run here yet and
   suggest `/batuta`.
2. Check background tasks (executors still running) and active Batuta worktrees,
   if any.
3. List plans in `.batuta/plan-*.md` with status ≠ done, if any.
4. Present compactly:
   - **In progress** — task, executor, since when, process state
     (running / awaiting verification).
   - **Done (recent)** — latest WORK.md entries with commits.
   - **Open plans** — title and progress (checked/total checkboxes).

Read-only: this skill changes no state, commits nothing, delegates nothing.
