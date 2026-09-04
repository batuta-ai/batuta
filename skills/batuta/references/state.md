# State — prose that survives the session

Read at Step 5, at `/batuta-pause` and at `/batuta-resume`. Everything here
is text a human edits; nothing breaks on a stray character.

## Contents

- Files
- WORK.md
- Run trail
- Handoff
- Stamps

## Files

| Path | Owner | Purpose |
|---|---|---|
| `WORK.md` (project root) | human and conductor | the conducting log: in progress, done |
| `.batuta/profile.md` | `/batuta-init` | stack, methodology, commands, execution and worktree modes, project map |
| `.batuta/routing.md` | `/batuta-init`, `/batuta-route` | the project's routing table |
| `.batuta/plan-<slug>.md` | `/batuta-plan` | approvable plan; input of `/batuta-loop` |
| `.batuta/runs/<date>-<slug>.md` | Step 5 | run trail, one per task |
| `.batuta/scout/<date>-<slug>.md` | scout | research report |
| `.batuta/handoff.md` | `/batuta-pause` | transit note, consumed by `/batuta-resume` |
| `.batuta/learnings.md` | Step 4 | rules distilled from rejected findings, append-only |

`.batuta/runs/`, `.batuta/scout/`, `.batuta/worktrees/` are listed in
`.git/info/exclude` — never in `.gitignore`, which belongs to the user.

## WORK.md

```markdown
# WORK — <project>

## In progress
- [ ] <task> → codex (delegated 2026-09-04)

## Done
- [x] <task> → opencode (opencode/kimi-k2.5), commit abc123 (trail: .batuta/runs/2026-09-04-<slug>.md)
- [x] <task> → codex (escalated from opencode after 2 fails), commit def456 (trail: …)
```

Entries in the user's language. Each Done line tells the routing story:
executor, model, retries, escalation. `/batuta-status` aggregates it;
nothing else stores metrics.

## Run trail

One per task, written at Step 5 next to the commit. An aborted task also
gets one, verdict `❌ aborted`, written when the failure is declared.

```markdown
# Run — <task title>

**Date:** <date> · **Lane:** <domain>/<complexity> · **Executor:** <executor + model>
**Commit:** <sha or —> · **Verdict:** ✅ approved | ⏫ escalated from <lane> | ❌ aborted

## Brief
<verbatim>

## Executor report
<verbatim, not summarized>

## Verification
- Criterion 1 — proof re-run: `<command>` → <observed result>
- Gates: 0 <pass|fail> · 1 <wrote|silent> · 2 <pass|fail> · 3 <pass|fail>
- Test-hygiene scans: <n/a | clean | finding at file:line>
- Cross-review: <n/a | accepted/declined findings, one line each>

## Retries and escalation
<empty when it passed first try; otherwise what failed and what changed>
```

Rules: brief and report verbatim — summarizing loses the evidence. The
Verification section is yours and stays short. `WORK.md` only points at
the trail. The trail is not memory: you never read `.batuta/runs/` during
the cycle; the retro, `/batuta-review` and the human do. No rotation, no TTL.

## Handoff

Written by `/batuta-pause`, four fixed sections, prose:

```markdown
# Handoff — <date>

## Cycle point
Where exactly the session stopped ("brief ready, delegation not sent").

## Decisions not yet written
Agreed in conversation but not yet in code or profile.

## Background
Executors running or pending, and what to do with each.

## Open questions
Pending questions for the user.
```

One handoff per project; pausing again overwrites it. `/batuta-resume`
absorbs it into `WORK.md` and deletes it.

## Stamps

Files derived from other files carry, on line 3, a stamp of their inputs:

```markdown
<!-- inputs: profile.md@sha256:1a2b3c4d5e6f -->
```

`sha256` is the first 12 hex characters of the input's digest.
`/batuta-init`, `/batuta-route` and `/batuta-status` recompute and report
`stale (<input> changed)`. Staleness is a warning, never a block; the
decision is the user's. Refresh the stamp on every rewrite.
