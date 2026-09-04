# No workarounds — fix the source, not the signal

A workaround is any change that makes a problem stop showing without
addressing why it exists. The brief forbids it (method line); Step 4
catches it (an unmarked workaround fails verification). This file is the
judgment rule for the marked ones.

## Signals

| Category | The signal silenced | Fix the source instead |
|---|---|---|
| Type | `as`, `any`, `!`, `@ts-ignore`, casts to satisfy the checker | make the types true |
| Lint | `eslint-disable`, `noqa`, `#[allow]` | fix what the rule flags |
| Swallow | empty catch, `.catch(() => null)`, ignored return codes | handle or propagate the error |
| Timing | `sleep`, `setTimeout` to fix ordering, blind retries | fix the ordering or the race |
| Patch | mutating prototypes, globals, library internals | use the library's extension point or replace the library |
| Scatter | `?.` and `??` chains guarding a value that should never be absent | fix where the value is produced |
| Clone | copy-and-tweak of similar code to dodge the real change | change the shared code |

## The gate

1. State the problem, then the root cause (`debug.md`).
2. Does the fix repair that cause, or only stop the symptom from showing?
3. Silencing a signal → redesign against the cause. Cause genuinely out of reach → the escape valve.

## Escape valve

Allowed only when all four hold:

1. The cause is in code the team does not control.
2. The proper fix needs an upstream change on an uncertain timeline.
3. Not shipping costs more than the debt.
4. The workaround is isolated — it leaks into no other code.

Then, all of: `// WORKAROUND: <reason> — see <issue>` at the site; a
removal issue; a test pinning the current behavior; a canary test that
fails once upstream fixes it; a review date within 90 days.

A marker without the four conditions and the containment is a workaround
in disguise: verification fails it.
