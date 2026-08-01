# Run trail — evidence that survives the session

How the maestro records each cycle in `.batuta/runs/`. Dormant like the
adapters: Step 5 points here in one line; read this file only when
writing a trail.

## When and where

One trail per task, written at Step 5 alongside the commit — the trail
follows the atomic-commit unit: a decomposed batch of six items leaves
six trails. An item that fails definitively (even after escalation) also
leaves one, verdict `❌ aborted`, written when the failure is declared —
that is where the evidence matters most.

Path: `.batuta/runs/<YYYY-MM-DD>-<slug>.md`. Ensure `.batuta/runs/` is
listed in `.git/info/exclude` (never `.gitignore` — that file is the
user's). Trail content follows the user's language, like `WORK.md`.

## Format

    # Run — <task title>

    **Date:** <date> · **Lane:** <lane> · **Executor:** <executor + model>
    **Commit:** <sha or —> · **Verdict:** ✅ approved | ⏫ escalated from <lane> | ❌ aborted · **Session:** <runtime session id, or —>

    ## Brief
    <the brief sent to the executor, verbatim>

    ## Executor report
    <the executor's relevant output, verbatim — not summarized>

    ## Verification
    - Criterion 1 — proof re-run: `<command>` → <observed result>
    - Test-hygiene scans: <n/a | clean | finding at file:line>
    - Cross-review: <n/a | accepted/declined findings, one line each>

    ## Retries and escalation
    <empty when it passed first try; otherwise what failed and what
    changed in the re-brief>

## Rules

- **Verbatim where it matters.** Brief and executor report enter without
  summarizing — summarizing is losing the evidence. The Verification
  section is the maestro's and stays short: command + observed result,
  never narrative.
- **`WORK.md` points, never inflates.** The task's line gains at most
  the trail file reference.
- **Cross-review findings land here.** After the maestro's judgment
  (`verification.md`, cross-review contract), accepted and declined
  findings are copied one line each into Verification; the external
  findings file remains disposable.
- **Not memory.** The maestro does not read `.batuta/runs/` during the
  cycle; only the retro, `/batuta:review` on demand, and the human do.
- **No retention machinery.** No rotation, TTL or compaction — text
  files the user deletes if they ever bother.
