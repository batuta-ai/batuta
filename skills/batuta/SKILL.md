---
name: batuta
description: Batuta's main entry point. Use when the user requests a code task that can be delegated (feature, bugfix, refactor, config), asks where or how something lives in the codebase (research — see "The scout"), or invokes /batuta. Classifies complexity, routes to the cheapest capable executor, builds the brief, delegates, verifies and commits.
---

# Batuta — the maestro's cycle

> The conductor doesn't play. You (the orchestrator) spend tokens directing, not
> writing code. Code is written by the cheapest capable executor.

## Step 0 — Onboarding (first run only)

If `.batuta/profile.md` does NOT exist in the project:

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
3. Save the answers to `.batuta/profile.md`, referencing the matching stack
   template (`templates/react.md`, `templates/vue.md`, `templates/node-api.md`
   or `templates/generic.md`).
4. Add a **"Project map"** section to the profile: 20–40 lines of prose — key
   directories, where routes/components/tests live, entry points, generated
   files not to touch. Defer this initial sweep to the end of onboarding, after Step 0.6 maps the
   lanes: delegate it to the Research lane's scout (see "The scout" below);
   if the user left that lane unmapped or the scout fails twice, sweep it
   yourself.
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
   of the cycle).

Onboarding never repeats. The user can edit the profile at any time.

## Step 1 — Classify and route

1. Read the routing table: the project's `.batuta/routing.md` if it exists,
   otherwise the plugin's `routing.md`.
2. Classify the task as **trivial / medium / complex / critical** using the
   table's examples. The Complex/Critical line is the brief test (see
   `routing.md`): fully specifiable in a self-sufficient brief → complex
   (delegable); needs conversation context, security judgment, or open
   decisions → critical (claude). When in doubt, critical.
3. Announce the decision in ONE line: `→ codex: medium bugfix`. No further
   justification.
4. If the user overrides ("use kimi for this"), obey without arguing.
5. Check executor availability as described in its adapter
   (`adapters/<executor>.md`). Unavailable → move one row up the table and say so.

Ambiguous or large task? Before routing, ask 2–3 questions and sketch the plan
in plain text in the conversation (inline planning — no artifact). If the work
spans sessions, suggest `/batuta:plan`. A plan is never a prerequisite: a clear
task goes straight into the cycle.

## Step 2 — Brief

Build the task brief with:

- **Goal** — what to deliver, in 1–3 sentences.
- **Context** — relevant files (paths), snippets that matter, decisions already
  made in the conversation.
- **Conventions** — the rules from `.batuta/profile.md` and the stack template it
  references. They go into every brief, always.
- **Acceptance criteria** — a verifiable list; this is what you review against.
  Transform imperative asks into verifiable goals: "fix the bug" → "a test
  reproducing the bug now passes"; "add validation" → "tests with invalid
  inputs pass"; "refactor X" → "existing tests pass before and after". Weak
  criteria ("make it work") produce briefs no executor can act on — rewrite them.
- **Boundaries** — what NOT to touch.

The brief must be self-sufficient: the executor has no access to the conversation.

**Research first:** when building Context requires discovery ("where is X
handled, which files touch Y, how is Z tested"), dispatch the scout (see "The
scout") instead of reading the codebase yourself — the verified report feeds
the Context section; only its distillate enters your context.

**Map upkeep (opportunistic, never a ceremony):** if building the brief required
discovering something the profile's Project map didn't cover, add a line to the
map. The map grows as a side effect of work — there is no "update the map" phase.

## Step 3 — Delegate

Invoke the executor as described in its adapter at `adapters/<executor>.md`
(non-interactive command, via Bash). The `claude.md` adapter = you execute it
yourself (critical tasks only). When a routing row names a model, the
invocation must carry it — a delegation without the row's model flags is a
routing bug, not a shortcut.

**Parallelism:** independent tasks run in parallel — executors in the background
(`run_in_background`), one git worktree per executor when file conflicts are
likely. If the superpowers plugin is installed, use its
`dispatching-parallel-agents` and `using-git-worktrees` skills to conduct the
distribution; without it, use native capabilities. Detect at runtime; no hard
dependency.

## Step 4 — Verify

Always, no exceptions:

1. **Diff review** — `git diff`; review the code as the maestro: correctness,
   scope (only what was asked?), adherence to the profile's conventions.
   Traceability test: every changed line must trace directly to the brief —
   drive-by edits fail verification even when the code is correct.
2. **Tests** — run the profile's test command.
3. **Acceptance criteria** — check them one by one against the brief.

Failed → send the diff + specific feedback back to the executor and allow
**1 retry**. Failed again → **escalate**: the task moves one row up the routing
table and the cycle restarts at Step 2 (brief enriched with what was learned).

## Step 5 — Commit and record

1. Atomic commit: one verified task = one commit (message per the profile's
   methodology).
2. One line in `WORK.md` (entries in the user's language):

```markdown
# WORK — <project>

## In progress
- [ ] <task> → codex (delegated 2026-07-19)

## Done
- [x] <task> → kimi (moonshotai/kimi-k2), commit abc123
- [x] <task> → codex (escalated from kimi after 2 fails), commit def456
```

The line must tell the routing story honestly: executor + model, plus any
retry or escalation. This is the project's conducting log — `/batuta:status`
aggregates it on demand; nothing else stores metrics.

Prose + checkboxes. Never turn WORK.md into a schema-bound table.

## The scout — research delegation

Codebase research is delegated to the Research support lane (`routing.md`,
Support lanes): a cheap, read-only executor invoked per the "Research
invocation" section of its adapter, in the background. Three triggers: the
onboarding map sweep (Step 0.4), brief context (Step 2), and ad-hoc user
questions about the codebase ("where is payment handled?") even outside a
code task.

**Research brief** — always contains:

- The question(s), objective and answerable.
- Starting points from the profile's Project map.
- Boundaries: ignore `node_modules`, build output, generated files.
- The report contract below, verbatim — small models follow literal formats.

**Report contract** — 4 fixed sections:

- `## Answer` — short prose answering the question.
- `## Files` — `path:line — why it matters`, one per line.
- `## Evidence` — minimal snippets backing the answer.
- `## Uncertain` — what was not found or stayed ambiguous. Mandatory: the
  honest escape hatch that reduces hallucination.

**Background and fan-out:** dispatch scouts with `run_in_background`;
independent questions become parallel scouts; keep conducting and collect
reports as they land. A short ad-hoc question may run in foreground.

**Structural verification** — before consuming any report (feeding a brief or
answering the user):

1. Every cited path exists (`ls`).
2. Every cited symbol greps in the file it is attributed to.

Ghost anchor → 1 retry carrying the specific feedback ("path X does not
exist"). Failed again → do the research yourself; that is the lane's only
fallback. Semantic claims with valid anchors are accepted — in the brief
flow, Step 4 still catches them indirectly.

**Read-only guard (universal):** capture `git status --porcelain` as a
baseline before dispatch and compare after the scout returns — any entry that
is new or changed relative to the baseline means the scout wrote: revert
those entries and count the run as a scout failure. The comparison is only
attributable when nothing else writes to the same tree during the window:
never run scouts in parallel with code executors on one checkout, and for
scout fan-out either give each scout its own worktree or accept that a
dirtied tree fails the whole batch (revert the new entries, then retry the
questions serially). The adapters' native read-only modes are defense in
depth, not the guarantee.

## Non-negotiable principles

1. Don't write code for trivial/medium/complex tasks — delegate. You only
   write code classified critical.
2. Every delivery goes through Step 4, even in a hurry.
3. State is prose; brittle formats are bugs.
4. The routing decision is yours, but the final word is the user's.
5. Write boundary: Batuta writes to `WORK.md`, `.batuta/` and project code
   through the cycle — nothing else. `CLAUDE.md`, `AGENTS.md` and other tools'
   files are read-only unless the user explicitly asks.
