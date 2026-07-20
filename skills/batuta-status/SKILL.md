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
5. **Routing read** (when the user asks about costs/savings, or whenever there
   are 10+ done entries): tally the Done lines — tasks per lane, escalations,
   and the delegation rate: % of tasks whose code was NOT written by the
   expensive lane. Present facts, not estimates: "14 of 23 tasks never touched
   your Claude subscription". A high escalation rate out of a lane is the
   actionable signal — the user is paying twice; suggest adjusting the routing
   table (weaker model than the lane needs, or optimistic classification).
   Money figures ONLY if the user has put reference prices in their routing
   table — then do the math and label it as based on their assumptions.

Read-only: this skill changes no state, commits nothing, delegates nothing.
