---
name: batuta-status
description: Show what Batuta is doing in this project — in progress, done, background executors, worktrees, open plans, and the routing read (delegation and escalation rates). Use for /batuta-status. Read-only.
disable-model-invocation: true
---

# Batuta status

1. Read `WORK.md`. Missing → say Batuta has not run here; suggest `/batuta-init` or `/batuta`.
2. Background executors still running (the runtime's task list), Batuta worktrees (`git worktree list | grep batuta/`), a running loop (`.batuta/journal/*.jsonl` without a terminal record).
3. Plans in `.batuta/plans/*.md` (and legacy `.batuta/plan-*.md`) with `Status ≠ done`; finished ones sit in `.batuta/plans/done/`.
4. Stamps: recompute `.batuta/routing.md`'s line-3 stamp against `profile.md`; report `stale` when it differs. Warning only.
5. Present compactly:
   - **In progress** — task, executor, since when, state (running / awaiting verification / parked with a question).
   - **Done (recent)** — the latest `WORK.md` entries with commits.
   - **Open plans** — title and progress (checked/total).
   - **Leftovers** — worktrees or journals nothing references.
6. **Routing read** — on request, or whenever there are 10+ done entries: tally Done lines per lane, escalations, and the delegation rate: the share of tasks whose code was not written by `self`. Facts, not estimates: "14 of 23 tasks never touched the conducting host's subscription". A high escalation rate out of a lane is the actionable signal — suggest a stronger model there or a more conservative classification. Money only when the user put reference prices in the routing table's Cost column; then multiply and label the assumptions as theirs.

*Done when:* the four blocks are shown and any stale stamp or leftover is named.

Read-only: changes no state, commits nothing, delegates nothing.
