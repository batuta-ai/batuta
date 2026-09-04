# Debug — root cause before fix

Read when a bugfix is classified `critical` (you implement), or when an
item failed verification even after escalation (you investigate before the
re-brief). The findings feed the brief's Context; the executor still
implements.

## Iron laws

1. No fix without a root-cause investigation first.
2. No fix without a failing test that proves the bug exists.
3. Three failed fixes → stop and question the design, not the symptom.

## Procedure

1. **Reproduce.** The exact command, input and output. A bug you cannot reproduce is a hypothesis, not a bug.
2. **Trace to the source.** Follow the failing value backwards through the call chain to the first place it goes wrong. Read the code; do not reason about it from memory.
3. **Name the cause in one sentence.** "X returns null when Y because Z." If the sentence needs "probably", keep tracing.
4. **Write the failing test** at the lowest layer that detects the failure. Run it red.
5. **Fix the source.** Then run the test green, then the suite.
6. **Check for siblings.** The same cause elsewhere; the same symptom with a different cause nearby.

*Done when:* the test went red then green, the suite passes, and the cause fits one sentence.

## For a re-brief

The enriched brief carries: the reproduction command, the traced cause, the
files on the path, and what the previous executor tried and why it failed.
It does not carry the fix — that stays the executor's.

## Signals you are patching, not fixing

A cast, a suppression, an empty catch, a sleep, a retry loop, a copy of
similar code with a tweak. See `no-workarounds.md`.
