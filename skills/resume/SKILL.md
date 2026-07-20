---
name: resume
description: Resume paused Batuta work. Use when the user invokes /batuta:resume or asks to pick up where a previous session left off.
---

# Batuta resume — pick up where the project left off

1. **Read the state:** `.batuta/profile.md`, `.batuta/routing.md`, `WORK.md`
   and `.batuta/handoff.md` (if present).
2. **Check git:** current branch, dirty tree, recent commits — reality may
   have moved since the pause; when the tree and the handoff disagree, the
   tree wins.
3. **Summarize in a few lines** (in-flight task, cycle point, pending
   decisions and questions) and confirm with the user before acting.
4. **Resume the cycle at the exact point.** Whatever the handoff carried
   becomes `WORK.md` lines or immediate action; then delete
   `.batuta/handoff.md` — it is a transit note, consumed on arrival.
5. **No handoff?** Resume from `WORK.md` alone and say so explicitly.
