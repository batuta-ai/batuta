# Verification — declared is not verified

Read once per session, at Step 4. Also the contract of `/batuta-review`.

## Contents

- The rule
- The four gates
- Scope check
- Diff review
- Test-hygiene scans
- Cross-review
- Retry and escalation

## The rule

The executor's report never counts as evidence — not "tests pass", not
"criterion met", not "done". Every acceptance criterion is verified by
re-running its smallest public proof (a test, a command, a request) against
the current tree, by you. A criterion whose proof you did not reproduce is
unverified, whatever the report says.

## The four gates

Run in order. Probe the core binary once per session:
`batuta capabilities 2>/dev/null | grep -q '"gate"'`. Only when that
succeeds does `batuta gate <name>` run each gate and print compact JSON;
an absent or older binary fails the probe and you run the commands
yourself. Never call a subcommand the probe did not list.

| Gate | Question | How |
|---|---|---|
| 0 · finished | Did the executor end on its own terms? | The adapter's `finished` rule (exit code, or the last result event). A crash is not a delivery. |
| 1 · tree | Did the session write anything? | Signature of `git status --porcelain` + `git diff HEAD` before and after. A signal, not a verdict: a task already done legitimately writes nothing — say so instead of failing. |
| 2 · tests | Does the suite pass? | The profile's test command, run by you, outside the executor's session, with stdin closed. The executor cannot fake green. |
| 3 · verify | Do the criteria hold? | Scope check, diff review, then each criterion's proof re-run. On `high`/`critical`, or when gate 1 was silent, or on a retry: also an independent read-only verifier (adapter's `readonly` line, cheap model) that emits one line per criterion — `TASK n: DONE` or `TASK n: INCOMPLETE — <what is missing>`. Zero lines, wrong count or any INCOMPLETE fails. |

## Scope check

`git status --porcelain` (in a worktree: `git diff --name-only <base>...batuta/<slug>`)
against the brief's Scope list. A path outside the list fails verification
even when the code is correct. Name the files in the feedback. Managed
state (`state.md`: `WORK.md`, `.batuta/`) is not scope: report it, never
fail on it.

## Diff review

Read `git diff` as the conductor:

- **Correctness** — does it do what the criteria say?
- **Traceability** — every changed line traces to the brief. Drive-by edits fail even when correct.
- **Conventions** — the profile's rules and the template's `Never:` block. A `Never:` hit is a convention failure.
- **Slop** — comments a reader of the surrounding code does not need; defensive checks or try/catch abnormal for trusted paths; type-silencing casts; nesting an early return would flatten; patterns inconsistent with the file. Findings go into the retry feedback.
- **Workarounds** — an unmarked workaround fails. A `// WORKAROUND: <reason>` marker demands the reason in the report; judge it.

## Test-hygiene scans

When the diff touches test files, scan before the verdict. Adapt the search
to the stack; the patterns are descriptive.

| Pattern | Verdict |
|---|---|
| Skip/only/exclusive marker introduced (`.skip`, `.only`, `xit`, `@pytest.mark.skip`, `t.Skip`) | fail |
| Strict assertion replaced by a permissive one where it covers a criterion (equality → truthy; exact → contains) | fail |
| New mock/stub on a dependency the criteria required real | fail |
| Snapshot or golden file updated with no criterion justifying it | fail |
| Criterion names an error or edge case; new tests assert only the happy path | feedback, not fail |

Name the pattern and file:line in the feedback. The executor fixes the
cause, never restates the claim.

## Cross-review

When a second reviewer is dispatched (`high`/`critical` by default,
`/batuta-review`, or on the user's ask):

- **Reviewer** — any executor from the routing table, invoked through its adapter's `readonly` line, which forbids writing. Never the executor that wrote the diff.
- **Lenses scale with the diff** — under ~50 changed lines: 1; up to ~200: 2; above: 3. In order: **Skeptic** (what breaks), **Architect** (fits the design and conventions), **Minimalist** (what the brief did not ask for). One dispatch carries all lenses.
- **Findings are a file you write** — the reviewer prints its findings between the lines `<<<FINDINGS` and `FINDINGS>>>`, one per line: `file:line · severity · concrete failure scenario`, or the single line `none`. You save that block verbatim to `.batuta/runs/<date>-<slug>.review.md` before judging. No block, or anything written to the tree → invalid round.
- **Contract parity** — when the item implements a spec or plan, the reviewer receives that artifact verbatim, never a paraphrase.
- **You judge** — accept or reject each finding with a one-line rationale. Accepted → normal failure flow. Rejected → recorded as declined. The verdict is always yours.
- **Read-only** — the reviewer's brief carries the read-only contract from `scout.md`. `git status --porcelain` before and after; any change reverts and fails the round.

Accepted and declined findings go one line each into the run trail.

## Retry and escalation

1. Fail → feedback with file:line, the failing command and its output, the flagged pattern. **One retry**, same executor, same worktree.
2. Fail again → **escalate**: one row up the routing table, cycle restarts at Step 2 with the brief enriched by the diagnosis. In a worktree, reset the branch first (`git reset --hard <base>` inside it).
3. Critical bugfix, or failure after escalation → investigate per `method/debug.md` before the re-brief.
4. A task that fails after escalation is aborted: trail written with verdict `❌ aborted`, worktree removed, dependents blocked and reported.

Verdict lines: `✅ approved` · `⏫ escalated from <lane>` · `❌ aborted`.
