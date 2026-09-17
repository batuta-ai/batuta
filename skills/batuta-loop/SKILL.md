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
2. **Pick the plan.** The user names it or there is exactly one `.batuta/plans/*.md` (or legacy `.batuta/plan-*.md`) with `Status: approved`. A plan not approved → stop; approval happens in `/batuta-plan`. With `.batuta/roadmap.md`, `batuta loop --roadmap` runs the phases in order, one delivery per approved plan, and stops with `waiting_plan` (exit 4) at a phase without one.
3. **Dry run.** `batuta loop --dry-run .batuta/plans/<slug>.md` prints the waves (dependency-safe, at most four tasks each), the executor and model per task with the fallbacks, the worktrees it would create, the test command. Show it. Any preflight failure (dirty tree, managed state uncommitted, no `Test:` line, unavailable executor, a task routed to `self`) stops here — nothing has been spent. Tasks on `self` run interactively through `batuta`; tick them, then loop the rest — or, on a loop-first project, seat `critical` on a CLI in `.batuta/routing.md` (`batuta-route`) and re-run the dry run.
4. **Launch.** Run `batuta loop .batuta/plans/<slug>.md` as a single long-lived process, through the runtime's background facility when available, or tell the user to run it in another terminal. Normal new, resume, answer, and roadmap execution already supervises and runs full final review; never duplicate it with another supervisor. The process must stay alive: no daemon or automatic chat notification exists, and ending a chat turn is not supervision. Report the journal path (`.batuta/journal/<delivery>.jsonl`) and `batuta watch`; `batuta loop --dashboard` prints one TSV listing.
5. **Questions from a task.** An executor that must stop prints one final `BATUTA-QUESTION: <text>` line (the brief states the protocol); the task parks: journal `waiting_input`, question in `.batuta/asks/<slug>-<task>.md`, run ends with exit 3. Relay it to the user; `batuta loop --answer <task> "<text>"` records the answer and resumes the task in the same worktree.
6. **Resume.** After an interruption, `batuta loop --resume <delivery>` loads the journal and continues from the last recorded operation; an executor that was running becomes a same-worktree retry. Completed tasks and their commits carry forward. A delivery that will not continue closes with `batuta loop --abandon <delivery>`, which ticks what integrated; the branch must not receive other commits while a delivery is open.
7. **Recover review.** For a pending gate, use `batuta loop --resume <delivery>` or `batuta loop --roadmap`; inspect without execution using `batuta loop --supervise <delivery> --review-status`. Never auto-accept, reset the attempt budget, or replay a failed or uncertain reviewer. After reconciling ownership and retained evidence, run `batuta loop --supervise <delivery> --review-judgment accept|reject --review-id <id> --review-digest <digest> --rationale "<text>"` only when user authorization covers that review judgment; never issue one unprompted. Plan approval or starting a loop does not authorize accepting adverse evidence. Existing authorization that covers the judgment is sufficient; do not demand a new approval. `SHIP` clears progression only; it never authorizes merge or publication.
8. **Report exactly.** Separate the journal's implementation state, review status, and command exit. `done` means implementation finalized, not accepted: exit 0 requires cleared review; `blocked` or `review_blocked` exits 2; `waiting_input` exits 3; roadmap `waiting_plan` exits 4; `canceled` exits 130; runtime or evidence errors exit 1; `abandoned` stays literal. Pending, adverse, incomplete, failed, or uncertain review blocks roadmap phases across restarts. Read the summary, `WORK.md`, and `batuta trail <delivery>`; report exact commits, aborted tasks, blockers, review state, and exit without rounding up to success.

*Done when:* implementation, review status, and command outcome have all been reported verbatim.

## What the loop never does

Merge to the default branch, push, approve its own gates or review judgment,
widen a Scope, override the routing table with a plan's `→ executor/model`
hint, or continue past a task that failed escalation — dependents are blocked
and reported. A usage limit is never a failure: the loop waits for the reset
and re-runs the same attempt.
