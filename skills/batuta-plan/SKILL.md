---
name: batuta-plan
description: Write an approvable plan for work that spans sessions — atomic-commit-sized tasks with lane, scope and acceptance criteria. Use for /batuta-plan. Not for work that fits one sitting (batuta).
disable-model-invocation: true
---

# Batuta plan — formal, approvable, resumable

Only for work that spans sessions. Work that fits one session uses
inline planning (`../batuta/references/method/clarify.md`) or goes
straight into the cycle.

## Procedure

1. **Understand the goal.** Ask the missing questions, few, one at a time, per `clarify.md`. Preserve executable requirements literally.
2. **Decompose** into tasks by the cycle's unit: the smallest deliverable that verifies and commits alone. For each task: one or two sentences; domain × complexity and the executor the routing table predicts; a closed Scope; acceptance criteria with their proof; dependencies.
3. **Right-size.** A task that needs more than one executor session is two tasks. A task with no verifiable criterion is not a task.
4. **Write** `.batuta/plan-<slug>.md`:

```markdown
# Plan — <title>
<!-- inputs: profile.md@sha256:<12 hex> routing.md@sha256:<12 hex> -->

**Goal:** <1–3 sentences>
**Created:** <date> · **Status:** proposed | approved | in progress | done

## Tasks
- [ ] 1. <title> — <domain>/<complexity> → <executor/model>
      Scope: <paths>
      Accept: <criterion → proof>; <criterion → proof>
- [ ] 2. <title> — <domain>/<complexity> → <executor/model>
      Depends on: 1
      Scope: <paths>
      Accept: <criterion → proof>

## Decisions and context
<free prose: what a fresh session needs to know to resume>
```

   Machine contract (read by `/batuta-loop`): a task is a `- [ ] N. <title> — <domain>/<complexity>` line, the `→ <executor/model>` tail optional; the lane is mandatory because the loop routes by it. `Accept:` is mandatory; `Depends on:` lists task numbers, in any order; `Scope:` is a comma-separated list of paths or globs. `**Status:**` is exactly one of the four words, on the `**Created:**` line, once. Everything else is prose.
5. **Self-check:**
   ```bash
   f=.batuta/plan-<slug>.md
   test "$(grep -c '^- \[ \] [0-9]*\.' $f)" = "$(grep -c '^- \[ \] [0-9]*\. .* — [a-z]*/\(low\|medium\|high\|critical\)' $f)"
   test "$(grep -c '^- \[ \] [0-9]*\.' $f)" = "$(grep -c '^      Accept:' $f)"
   test "$(grep -c '^\*\*Created:\*\*.*\*\*Status:\*\* \(proposed\|approved\|in progress\|done\)$' $f)" = 1
   ```
6. **Present and wait for approval.** Set `Status: approved` only on the user's word.
7. Approved → execute task by task through the `batuta` cycle, ticking checkboxes and recording in `WORK.md`; or hand off to `/batuta-loop` for an unattended run.

*Done when:* the file exists, the self-check passes, the user approved or asked for changes.
