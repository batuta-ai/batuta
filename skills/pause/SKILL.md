---
name: pause
description: Pause Batuta work across sessions. Use when the user invokes /batuta:pause or says they are stopping and want to hand the current state off to a future session.
---

# Batuta pause — session handoff

1. **Honest `WORK.md`:** update the in-flight task's line with its real state
   ("delegated to codex, awaiting verification") — the conducting log stays
   truthful.
2. **Background tasks:** list what is still running; note in `WORK.md` what
   will finish on its own, stop what would be orphaned.
3. **Write `.batuta/handoff.md`** — prose, four fixed sections:

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

The handoff is a transit note, not state: `/batuta:resume` absorbs it into
`WORK.md` and deletes it. One handoff per project — pausing again overwrites
it.
