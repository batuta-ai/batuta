# Hardened verification — self-report is not evidence

How the maestro hardens Step 4 and `/batuta:review` against an executor
that *declares* done without the diff sustaining the declaration. Dormant
like the adapters: skills point here in one line; read this file only when
conducting a verification.

## The rule: declared ≠ verified

The executor's report never counts as evidence — not "tests pass", not
"criterion met", not "done". Every acceptance criterion is verified by
re-running its smallest public proof (a test, a command, a request) against
the current tree, by the maestro. A criterion whose proof the maestro did
not reproduce is unverified, whatever the report says.

## Test-hygiene scans

When the diff touches test files, scan it before the verdict. The rules are
descriptive — adapt the search to the project's stack and test framework:

1. **Skipped or disabled test added** — skip/only/exclusive markers
   introduced in the diff (the stack's equivalents of `.skip`, `.only`,
   `xit`, `xdescribe`, `@pytest.mark.skip`, `@Ignore`, `t.Skip`).
   → verification failure, always.
2. **Weakened assertion** — a strict assertion replaced by a permissive one
   in the same diff that claims the criterion (equality → truthy/defined/
   not-null; exact value → contains/matches-anything).
   → verification failure when the assertion covers an acceptance criterion.
3. **Mock hiding a real dependency** — a new mock/stub/patch on a
   dependency the brief's criteria required real (integration behavior).
   → verification failure.
4. **Snapshot or golden-file drift** — a snapshot/fixture/golden file
   updated with no acceptance criterion justifying the change.
   → verification failure.
5. **Happy path only** — a criterion names an error or edge case, but the
   new tests assert only the positive path.
   → feedback in the retry, not an automatic failure.

A scan hit follows the cycle's normal failure flow: specific feedback +
1 retry, then escalation. Name the flagged pattern and file:line in the
feedback — the executor must fix the cause, not restate the claim.

## Slop checklist (inside the diff review)

Flag during the diff review: comments a reader of the surrounding code
doesn't need; defensive checks or try/catch abnormal for trusted paths;
type-silencing casts (`any` and friends); nesting that early returns would
flatten; patterns inconsistent with the surrounding file. Findings go into
the retry feedback. A finding that violates the stack template's `Never:`
block is a convention violation and fails verification as such.
