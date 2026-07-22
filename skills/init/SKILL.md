---
name: init
description: Batuta's onboarding and reconfiguration. Use when the user invokes /batuta:init, wants to set Batuta up in a project, or wants to change an existing setup (lanes, models, profile answers, project map).
---

# Batuta init — onboarding and reconfiguration

Two modes, decided by whether `.batuta/profile.md` exists in the project.

## First run (no `.batuta/profile.md`)

1. Detect the stack (package.json, composer.json, go.mod, etc.) and suggest it
   as the default. Read `CLAUDE.md`/`AGENTS.md` if present — the profile must
   complement them, never duplicate what they already say. If they contradict
   the user's onboarding answers, flag the conflict to the user — never edit
   those files (executors like codex read `AGENTS.md` on their own; an
   unflagged contradiction means conflicting instructions mid-task).
2. Ask 3–5 short questions, all at once:
   - Stack? (detected suggestion as default)
   - Methodology: TDD or tests after? Conventional commits or free-form?
     Trunk-based or feature branches?
   - Test command? Build command?
   - Batch execution: sequential (default) or parallel? (how decomposed
     multi-item requests run — see Step 1.5 of the cycle; the answer becomes
     the profile's Execution line, written as a literal line, e.g.
     `Execution: sequential`)
   - Worktree mode: `off`, `medium+` (default) or `always`? (whether the
     executor works in an isolated git worktree per task — see Steps 3–5 of
     the cycle; the answer becomes the profile's literal line, e.g.
     `Worktree: medium+`)
   - Install command? (optional — sets up the test environment inside a
     worktree, e.g. `npm install`; becomes the profile's `Install:` line,
     omitted when there is none)
3. Save the answers to `.batuta/profile.md`, referencing the matching stack
   template (`templates/react.md`, `templates/vue.md`, `templates/node-api.md`
   or `templates/generic.md`).
4. Add a **"Project map"** section to the profile: 20–40 lines of prose — key
   directories, where routes/components/tests live, entry points, generated
   files not to touch. Defer this initial sweep to the end of onboarding,
   after step 6 below maps the lanes: delegate it to the Research lane's
   scout (see `skills/batuta/SKILL.md`, "The scout"); if the user left that
   lane unmapped or the scout fails twice, sweep it yourself.
   The map says where to start looking, not everything: details stay with
   grep and git, which never go stale.
5. **Takeover:** if artifacts from another framework exist (`.planning/`,
   `TODO.md`, roadmaps…), offer a one-time import: in-progress/done work
   becomes `WORK.md` lines, large remaining work becomes
   `.batuta/plan-<slug>.md`, relevant decisions become profile lines. Leave
   the old artifacts untouched — the user archives them if they want.
6. **Executor check and lane mapping:** run the availability checks from each
   adapter referenced by the routing table (`command -v codex`,
   `opencode providers list`, …) and show what was found. Only what the table
   references — never scan the machine for every CLI that might exist
   (cursor, copilot, kimi CLI, …); those adapters stay dormant until the user
   asks for one ("put cursor on the medium lane"), which is when its adapter
   gets read and its row gets written. Then propose a lane
   mapping built from what is actually installed — the default table assumes
   the full trio (opencode + codex + claude), but the user's real setup rules:
   - **Full trio:** default table; confirm the trivial-lane opencode model and
     the complex-lane executor — codex + strong model (default) or a strong
     Claude model via background instance (`claude -p --model opus`, see
     `adapters/claude.md`), whichever the user prefers for briefable
     heavy-logic work.
   - **No codex** (e.g. claude + opencode): opencode keeps trivial; suggest a
     mid-tier opencode model for medium; complex goes to a strong Claude model
     in background; critical stays with the session.
   - **claude only:** lanes differentiate by Claude model via background
     instances (`claude -p --model <model>`, see `adapters/claude.md`) — e.g.
     haiku for trivial, sonnet for medium, opus for complex, the session
     itself for critical.
   The same single confirmation question also covers the **Research support
   lane** (`routing.md`, Support lanes): suggest a cheap candidate from the
   discovery already run — filter to `kimi|haiku|mini|nano|flash|free`. Full
   trio or no-codex → a cheap opencode model or `claude -p --model haiku`;
   claude only → haiku via background instance.
   The user has the final word on which CLI/provider/model owns each lane —
   present the proposal and let them adjust before writing anything. For
   multi-model CLIs, discover models yourself — the user never enumerates
   anything: run the discovery from `adapters/opencode.md` (`opencode models`
   filtered to cheap candidates) and `adapters/codex.md` (Model selection) and
   suggest 2–3 options per lane. Ask ONE confirmation question covering the
   whole mapping (lanes + models). Write the result as the project's
   `.batuta/routing.md`: the local copy is born here, with the exact executors
   and model IDs confirmed by the user. If an executor disappears later, tell
   the user which lanes collapse upward (unavailability rule) instead of
   letting them find out on the first delegation.
7. Create `WORK.md` at the project root if it doesn't exist (format in Step 5
   of the cycle — `skills/batuta/SKILL.md`).

The user can edit the profile at any time; to revisit the setup with help,
run `/batuta:init` again — that is the reconfigure mode below.

## Reconfigure (`.batuta/profile.md` exists)

1. Re-run the availability checks of every adapter the project's routing
   table references — never scan the machine (dormant adapters rule; a new
   CLI enters only when the user asks for it).
2. Show the current setup in a few lines: lane mapping (executor + model per
   row, Research included), profile answers, and how stale the Project map
   looks.
3. Ask what to change — one question: lane/model ("codex is installed now",
   "swap the Research model"), profile answers (test command, methodology),
   the batch execution mode (sequential ↔ parallel, the profile's Execution line),
   the worktree mode or Install command (the profile's Worktree and Install
   lines), or a fresh map sweep (delegated to the scout, like first-run step 4).
4. Rewrite only what changed (`.batuta/routing.md` and/or
   `.batuta/profile.md`), reusing first-run step 6's discovery and single
   confirmation question for any lane/model change. Never touch `WORK.md`.
