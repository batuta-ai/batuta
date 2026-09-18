---
name: batuta-loop
description: Run an approved plan unattended — the core binary conducts, executors implement in worktrees, gates verify, one commit per task. Use for /batuta-loop. Not for ad-hoc tasks (batuta) or writing the plan (batuta-plan).
disable-model-invocation: true
---

# Batuta loop — the mechanical conductor

`batuta loop` is the `batuta-ai/core` binary conducting an approved plan
without a model: table routing, one fresh executor session per task, four
gates, cause-aware fix cycles, one-row escalation, one commit per task, and
durable bookkeeping.

## Procedure

1. **Preflight.** `command -v batuta` — absent → say the core binary is missing, give the README install line, offer the interactive cycle. `batuta version` older than `v1.1.0-beta.23`, or `batuta capabilities` without `"loop"` → say so, offer the interactive cycle, stop. Update through the project's chosen install path; never install or update without authorization. Then `batuta doctor`: hosts, adapters, clean tree, test command, skills version.
2. **Pick the plan.** The user names it or there is exactly one `.batuta/plans/*.md` (or legacy `.batuta/plan-*.md`) with `Status: approved`. A plan not approved → stop; approval happens in `/batuta-plan`. With `.batuta/roadmap.md`, the later `batuta loop --transport <mode> --roadmap` runs phases in order, one delivery per approved plan, and stops with `waiting_plan` (exit 4) at a phase without one.
3. **Dry run.** Freeze each executor/model/effort/cost, choose `<mode>` from `cli|acp|auto`, then run `batuta loop --transport <mode> --dry-run .batuta/plans/<slug>.md`; dry-run does not persist it. CLI is default; headless core has no native children. ACP needs core ≥`v1.1.0-beta.24`, `dispatch` and exact qualification; never install, substitute, widen permissions or compare prereleases lexically. Show the waves (at most four tasks each), routes, worktrees and tests. Dirty tree, uncommitted managed state, no `Test:`, unavailable executor or `self` stops before spend. Run `self` interactively and tick it, or route `critical` to a CLI and rerun.
4. **Launch.** Repeat the policy: run `batuta loop --transport <mode> .batuta/plans/<slug>.md` as one long-lived process, through the runtime's background facility when available, or tell the user to use another terminal. New, resume, answer and roadmap runs already supervise and run full final review; never duplicate a supervisor. Keep the process alive: no daemon or automatic chat notification exists, and ending a chat turn is not supervision. Report `.batuta/journal/<delivery>.jsonl` and `batuta watch`; `batuta loop --dashboard` prints one TSV listing.
5. **Questions from a task.** A stopped executor prints one final `BATUTA-QUESTION: <text>`; the task parks in `waiting_input`, writes `.batuta/asks/<slug>-<task>.md`, and exits 3. Relay it; `batuta loop --transport <mode> --answer <task> "<text>"` records the answer and resumes the same worktree.
6. **Resume.** `batuta loop --transport <mode> --resume <delivery>` loads the journal and continues from its last operation. If the interrupted attempt may have submitted, park and reconcile it; never turn uncertainty into a retry. Otherwise a formerly running executor becomes a same-worktree retry. Completed tasks/commits carry forward. To stop, `batuta loop --abandon <delivery>` ticks integrated work; no other commits may enter its branch while open.
7. **Recover review.** For a pending gate, use `batuta loop --transport <mode> --resume <delivery>` or `batuta loop --transport <mode> --roadmap`; inspect with `batuta loop --supervise <delivery> --review-status`. Never auto-accept, reset attempt budget or replay a failed/uncertain reviewer. After reconciling ownership/evidence, run `batuta loop --supervise <delivery> --review-judgment accept|reject --review-id <id> --review-digest <digest> --rationale "<text>"` only when existing user authorization covers it; never issue one unprompted. Starting a loop does not authorize adverse-evidence acceptance. `SHIP` clears progression only, never merge/publication.
8. **Report exactly.** Separate implementation, review and exit. `done` is finalized, not accepted: exit 0 requires cleared review; blocked/review_blocked 2; waiting_input 3; waiting_plan 4; canceled 130; runtime/evidence error 1; abandoned stays literal. Pending, adverse, incomplete, failed or uncertain review blocks phases across restarts. Read summary, `WORK.md` and `batuta trail <delivery>`; report exact commits, aborted tasks, blockers, review and exit. Transport receipts remain worker claims; progress never completes criteria, missing usage is unknown, and verification stays an independent CLI session.

*Done when:* implementation, review status, and command outcome have all been reported verbatim.

## What the loop never does

Merge to the default branch, push, approve its own gates or review judgment,
widen a Scope, override the routing table with a plan's `→ executor/model`
hint, or continue past a task that failed escalation — dependents are blocked
and reported. A usage limit is never a failure: the loop waits for the reset
and re-runs the same attempt.
