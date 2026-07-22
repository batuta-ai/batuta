# Superpowers integration — borrowed method, Batuta's rules

How the maestro conducts the cycle when the
[superpowers](https://github.com/obra/superpowers) plugin is installed.
Dormant like the adapters: skills point here in one line; read this file
only when a pointer fires.

## Universal rules

- **Detection:** at runtime, at the moment of conducting the step —
  superpowers is installed when `superpowers:*` skills appear in the
  session's available skills. No hard dependency: absent → the step runs
  exactly as the skill's own text describes. The skills' baseline text IS
  the degradation path; this file only changes *how* a step is conducted,
  never *what* it delivers.
- **Authority:** superpowers supplies the *method* — the questions, the
  rigor, the checklists. Batuta supplies the *material rules*: artifacts
  live in `.batuta/` and `WORK.md`, implementers come from the routing
  table, verification and commit are per item (Steps 4–5). When a
  superpowers skill says to write to `docs/superpowers/`, to use Claude
  subagents as implementers, or to skip Step 4/5, Batuta's rule prevails.

## Method in the brief (external executors)

codex and opencode may have superpowers installed on *their* side — Batuta
cannot see the executor's environment. Every code brief therefore carries
one conditional method line, verbatim:

> Method: if superpowers skills are available in your environment, conduct
> the work with them — `test-driven-development` for implementation,
> `systematic-debugging` for bug investigation. Otherwise, work test-first
> from the acceptance criteria.

It degrades on its own: an executor without superpowers ignores the
condition and follows the baseline. No detection, no per-executor
configuration.

## Map — cycle moment → skill → what Batuta keeps

| Cycle moment | Superpowers skill | What Batuta keeps |
| --- | --- | --- |
| Ambiguous/creative request (Step 1) | `brainstorming` | design feeds the brief or plan; artifacts in `.batuta/`, never `docs/superpowers/` |
| `/batuta:plan` | `writing-plans` (method) | `.batuta/plan-<slug>.md` format and location; predicted executor per task; user approval before executing |
| Batch orchestration (Steps 1.5/3) | `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees` | each "subagent" is an external executor from the routing table; verify/commit per item, never batched |
| Verification (Step 4) and `/batuta:review` | `requesting-code-review`, `verification-before-completion` | the brief's criteria, traceability test, retry/escalation ladder, verdict |
| Critical bugfix or post-escalation failure | `systematic-debugging` | findings feed the enriched re-brief; escalation follows the routing table |
| claude lane (critical tasks) | `test-driven-development`, `verification-before-completion` | atomic commit and `WORK.md` record (Step 5) |

### Adaptation per moment

- **Ambiguous request (Step 1):** conduct the clarifying questions with
  `brainstorming`'s method — one question at a time, approaches with
  trade-offs before settling. The outcome is still inline planning (plain
  text in the conversation) or a handoff to `/batuta:plan`; no design doc.
- **`/batuta:plan`:** decomposition, dependency analysis and task
  right-sizing follow `writing-plans`; the artifact is
  `.batuta/plan-<slug>.md` in the existing format, with predicted executor
  per task, and execution still waits for user approval.
- **Batch orchestration:** `subagent-driven-development` conducts the
  dispatch/collect/review loop; `dispatching-parallel-agents` and
  `using-git-worktrees` conduct parallel distribution. Who implements is
  the routed lane's executor, never a Claude subagent; verification and
  commit remain per item as each executor returns.
- **Verification:** run Step 4 with `requesting-code-review`'s reviewer
  rigor and `verification-before-completion`'s evidence-before-claims. The
  criteria remain the brief's; the verdict and the retry/escalation ladder
  remain Batuta's.
- **Debugging:** a bugfix classified critical, or an item that failed
  Step 4 even after escalation, is investigated with
  `systematic-debugging`; findings feed the enriched re-brief.
- **claude lane:** when the maestro implements (critical tasks), work
  test-first with `test-driven-development` and close with
  `verification-before-completion` before Step 5's atomic commit.
