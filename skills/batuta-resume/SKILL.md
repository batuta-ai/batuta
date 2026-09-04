---
name: batuta-resume
description: Resume paused Batuta work from the files alone — state, handoff, git reality — and continue at the exact cycle point. Use for /batuta-resume or "pick up where we left off".
disable-model-invocation: true
---

# Batuta resume — pick up where the project left off

1. **Read the state:** `.batuta/profile.md`, `.batuta/routing.md`, `WORK.md`, `.batuta/handoff.md` if present.
2. **Check git:** branch, dirty tree, recent commits, Batuta worktrees, journals without a terminal record. Reality may have moved since the pause; when the tree and the handoff disagree, the tree wins.
3. **Summarize in a few lines** — in-flight task, cycle point, pending decisions and questions — and confirm with the user before acting.
4. **Resume at the exact point.** Handoff content becomes `WORK.md` lines or immediate action. A parked loop → `batuta loop --resume <delivery>` after the user confirms. Then delete `.batuta/handoff.md`: consumed on arrival.
5. **No handoff?** Resume from `WORK.md` alone and say so.

*Done when:* the user confirmed the summary, the handoff is gone, and the cycle is running or the next step is named.
