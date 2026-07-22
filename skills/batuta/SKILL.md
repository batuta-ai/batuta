---
name: batuta
description: Batuta's main entry point — the conducting cycle. Use when the user requests a code task that can be delegated (feature, bugfix, refactor, config), asks where or how something lives in the codebase (research — see "The scout"), or invokes /batuta. Classifies complexity, routes to the cheapest capable executor, builds the brief, delegates, verifies and commits. Setup lives in /batuta:init.
---

# Batuta — the maestro's cycle

> The conductor doesn't play. You (the orchestrator) spend tokens directing, not
> writing code. Code is written by the cheapest capable executor.

## Step 0 — Gates

Two one-line checks before anything else:

1. **No `.batuta/profile.md`** → the project is not set up: tell the user to
   run `/batuta:init` and stop. Never run onboarding inline.
2. **`.batuta/handoff.md` exists** → there is paused work: say so in one line
   ("paused work from <date> — `/batuta:resume` to pick it up, or I continue
   with the new request") and obey the user's choice. Never auto-resume.

## Step 1 — Classify and route

1. Read the routing table: the project's `.batuta/routing.md` if it exists,
   otherwise the plugin's `routing.md`.
2. Classify the task as **trivial / medium / complex / critical** using the
   table's examples. The Complex/Critical line is the brief test (see
   `routing.md`): fully specifiable in a self-sufficient brief → complex
   (delegable); needs conversation context, security judgment, or open
   decisions → critical (claude). When in doubt, critical.
3. Announce the decision in ONE line: `→ codex: medium bugfix`. No further
   justification. For a multi-deliverable request, skip this single-line
   announcement — Step 1.5 announces per item instead.
4. If the user overrides ("use kimi for this"), obey without arguing.
5. Check executor availability as described in its adapter
   (`adapters/<executor>.md`). Unavailable → move one row up the table and say so.

Ambiguous or large task? Before routing, ask 2–3 questions and sketch the
plan in plain text in the conversation (inline planning — no artifact); with
superpowers installed, conduct the questions by the `brainstorming` method
(the plugin root `superpowers.md`, Step 1 row). If the work spans sessions,
suggest `/batuta:plan`. A plan is never a prerequisite: a clear task goes
straight into the cycle.

## Step 1.5 — Decompose

A task is the smallest deliverable that can be verified and committed on its
own. When the request contains more than one such deliverable (a list of
components, "X, Y and Z", plural scope), decompose before briefing:

1. Split the request by the unit rule above: 6 components = 6 tasks, each
   getting its own full cycle — brief → delegate → verify → commit.
2. Classify and route each task individually (Step 1): a batch may mix
   trivial and medium items, each going to its own lane.
3. Order by dependency: items that depend on each other run in the order the
   dependency imposes; independent items keep the list's order.
4. Announce one line per item and start the first cycle immediately — no
   confirmation stop: `1/6 → codex: medium — Card component`.
5. Coupled items that cannot be verified separately stay as one task — a
   declared exception in the announcement, never the silent default.

**Execution mode:** sequential by default — one item at a time on the main
checkout, each cycle ending in its own commit before the next begins. The
profile's Execution line (`.batuta/profile.md`) may set `parallel`, and the
user can override per request ("run these in parallel"). Parallel batches
follow Step 3's parallelism, but verification and commit remain per item,
as each executor returns. The profile's Worktree line (Step 3) also applies
per item: each task's cycle gets its own worktree when its lane calls for it.

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

**Method line:** every code brief also carries the conditional method line
from `superpowers.md` ("Method in the brief") — the executor may have
superpowers on its side; without it the line degrades to test-first by the
acceptance criteria.

**Research first:** when building Context requires discovery ("where is X
handled, which files touch Y, how is Z tested"), dispatch the scout (see "The
scout") instead of reading the codebase yourself — the verified report feeds
the Context section; only its distillate enters your context.

**Map upkeep (opportunistic, never a ceremony):** if building the brief required
discovering something the profile's Project map didn't cover, add a line to the
map. The map grows as a side effect of work — there is no "update the map" phase.

**Batch economy:** in a decomposed batch (Step 1.5), build Context +
Conventions once — including any scout dispatch — and reuse the block across
the batch's briefs; only Goal, acceptance criteria and boundaries vary per
item. Six cycles must not cost six times the research.

## Step 3 — Delegate

Invoke the executor as described in its adapter at `adapters/<executor>.md`
(non-interactive command, via Bash). The `claude.md` adapter = you execute it
yourself (critical tasks only) — with superpowers installed, test-first per
`superpowers.md` (claude lane row). When a routing row names a model, the
invocation must carry it — a delegation without the row's model flags is a
routing bug, not a shortcut.

**Worktree (per profile):** the profile's Worktree line — `off | medium+ |
always`, no line = `off` — decides where the executor works. When the task's
lane triggers it (`medium+` = medium lane and above; `always` = every lane),
create a worktree and branch for the task: ensure `.batuta/worktrees/` is
listed in `.git/info/exclude` (never `.gitignore` — that file is the
user's), then `git worktree add .batuta/worktrees/<slug> -b batuta/<slug>`,
and invoke the executor with the worktree as its working directory. The
executor may commit freely there (WIP) — its commit granularity does not
matter; the maestro rewrites history at integration (Step 5). Mode `off` or
a non-triggering lane → the executor works on the main checkout as before.
The user can override per request; with superpowers installed,
`using-git-worktrees` conducts creation and cleanup (`superpowers.md`).

**Parallelism:** when the execution mode calls for it (Step 1.5 — profile set
to `parallel`, or the user asks), independent tasks run in parallel —
executors in the background (`run_in_background`). With the Worktree line
active each task already runs in its own worktree; with it `off`, create
one worktree per executor when file conflicts are likely. With superpowers installed, conduct
the distribution per `superpowers.md` (batch orchestration row); without it,
use native capabilities. Detect at runtime; no hard dependency.

## Step 4 — Verify

With superpowers installed, conduct this step per `superpowers.md`
(verification row). A critical bugfix, or a failure that survives
escalation, is investigated per its debugging row before the re-brief.

Always, no exceptions:

1. **Diff review** — `git diff`; review the code as the maestro: correctness,
   scope (only what was asked?), adherence to the profile's conventions.
   Traceability test: every changed line must trace directly to the brief —
   drive-by edits fail verification even when the code is correct.
2. **Tests** — run the profile's test command.
3. **Acceptance criteria** — check them one by one against the brief.

**In a worktree** (Step 3): the diff review reads
`git diff main...batuta/<slug>`, and tests run inside the worktree. If the
test command fails for environment reasons (missing dependencies — not a
red test), run the profile's Install command inside the worktree and retry
once; no Install line → declare the fallback out loud and run the tests on
the main checkout with the item's diff applied — never silently.

Failed → send the diff + specific feedback back to the executor and allow
**1 retry**. Failed again → **escalate**: the task moves one row up the routing
table and the cycle restarts at Step 2 (brief enriched with what was learned).
In a worktree, the retry happens in the same worktree; an escalation resets
the branch (`git reset --hard main`) before the next executor takes over. An
item that fails definitively has its worktree and branch removed — the main
checkout was never touched.

In a batch (Step 1.5), a task that fails even after escalation is skipped:
continue with the remaining independent items and report the failure at the
end. Items that depended on the failed one are blocked and reported — never
executed blindly.

## Step 5 — Commit and record

1. Atomic commit: one verified task = one commit (message per the profile's
   methodology). N tasks delivered = N commits — batching multiple tasks
   into one commit is a cycle violation, not a shortcut. In a worktree,
   integrate by squash on the main checkout — `git merge --squash
   batuta/<slug>`, then commit with the maestro's message: the executor's
   WIP history never reaches main. Then remove the worktree and branch
   (`git worktree remove .batuta/worktrees/<slug>`,
   `git branch -D batuta/<slug>`).
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
onboarding map sweep (`skills/init/SKILL.md`), brief context (Step 2), and ad-hoc user
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
