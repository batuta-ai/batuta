---
name: batuta-pause
description: Pause Batuta work across sessions — honest WORK.md plus a handoff note a fresh session resumes from. Use for /batuta-pause or when the user is stopping for now.
disable-model-invocation: true
---

# Batuta pause — hand off to a future session

1. **Honest `WORK.md`.** Update the in-flight task's line with its real state ("delegated to codex, awaiting verification"; "parked with a question").
2. **Background.** List executors still running. Note in `WORK.md` what finishes on its own; stop what would be orphaned. A running `batuta loop` is not an orphan: record its journal path; it resumes with `--resume`.
3. **Worktrees.** List Batuta worktrees and the branch each holds. Remove none.
4. **Write `.batuta/handoff.md`** — four sections, prose, format in `../batuta/references/state.md`: Cycle point · Decisions not yet written · Background · Open questions.
5. Say in one line where the project stands and that `/batuta-resume` picks it up.

*Done when:* `WORK.md` is truthful and the handoff has its four sections filled or marked `none`.

The handoff is a transit note, not state: `/batuta-resume` absorbs it into
`WORK.md` and deletes it. One handoff per project; pausing again
overwrites.
