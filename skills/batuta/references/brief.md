# The brief — what, never how

Read once per session, at Step 2. The brief is the whole interface between
the conductor and the executor: the executor sees nothing else.

## Contents

- Sections
- Acceptance criteria
- Scope
- Test laws
- Sweep
- Method
- Checklist

## Sections

| Section | Carries |
|---|---|
| **Goal** | What to deliver, 1–3 sentences. |
| **Context** | Relevant paths, the snippets that matter, decisions already made in the conversation. Code appears as evidence of what exists, never as the fix. |
| **Conventions** | The profile's rules, then the **Conventions for briefs** section (bullets and `Never:` block) of the stack template and of every template in its `Extends` chain, child first up to `generic.md`. Verbatim, every brief. The templates' *Verification hints* and catalog note never enter a brief — they are yours, at Step 4. |
| **Acceptance criteria** | Verifiable list. This is what Step 4 checks. |
| **Boundaries** | What not to touch. |
| **Scope** | Closed list of paths the task may change. |
| **Expected evidence** | What the executor reports back: files touched, commands run with actual output, uncertainty declared as such. |
| **Stop conditions** | When to stop and report instead of improvising. |

A section with nothing to say carries `Unknown — <reason>`. A silent gap
reads as "nothing to say".

The brief is self-sufficient. The executor has no access to the
conversation, the profile or this file.

## Acceptance criteria

Turn imperatives into verifiable goals:

| Ask | Criterion |
|---|---|
| fix the bug | a test reproducing the bug now passes |
| add validation | tests with invalid inputs pass |
| refactor X | existing tests pass before and after |
| make it work | rewrite — no executor can act on it |

Each criterion names its proof: the command, the test, the request.

## Scope

- Files when known; a directory or glob when discovery is part of the task.
- Test paths and legitimately touched generated files (locks, snapshots) are listed explicitly. No implicit exemptions.
- Close with: *do not change anything outside this list; if the task requires it, stop and report.*
- No closable list → `Unknown — <reason>` plus the narrowest bound the task admits.

Widening the Scope is the conductor's decision at re-brief, never the executor's.

## Expected evidence and stop conditions

Evidence: paths touched, each command with its real output, what was not
verified. Stop conditions, always these three plus any task-specific ones:

1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test the executor just wrote is not that).
3. The fix needs edits beyond Scope or Boundaries.

Progress protocol, same section, verbatim: for each acceptance criterion
n, print an isolated line `BATUTA-PROGRESS <n> START` before the first
edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes
locally. Plain text, nothing else on that line, no tool required. The
loop journals the lines as `task_progress` records and `--dashboard
--watch` shows them; in the interactive cycle they let you read the
executor's log at a glance.

## Test laws

When the criteria involve tests, the brief carries three laws verbatim:

1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

## Sweep (medium lane and above)

Reread the brief. Delete any "how" that leaked — suggested approach,
step-by-step plan, after-state code — keeping only the requirement it was
smuggling. The `low` lane keeps prescription on purpose: a weak model needs
the direction.

## Method

Every code brief carries one method line:

> Work test-first from the acceptance criteria. Investigate root cause before
> fixing a bug; never silence a signal (cast, suppression, empty catch, sleep)
> instead of fixing its source — if you must, mark `// WORKAROUND: <reason>`
> and say so in your report.

## Checklist

*Done when* every line holds:

- [ ] Eight sections present; empty ones say `Unknown — <reason>`.
- [ ] Every criterion names its proof.
- [ ] Scope is a closed list with the closing sentence.
- [ ] Conventions pasted from the profile and the template chain's Conventions sections only — no verification hints.
- [ ] Test laws present when tests are involved.
- [ ] Sweep done (medium+).
- [ ] Method line present.
- [ ] Nothing in the brief depends on the conversation to be understood.
