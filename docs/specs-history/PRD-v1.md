# PRD — Batuta

> *Quem rege não toca.* — the one who conducts does not play.

**Date:** 2026-07-19
**Status:** Design-approved draft — pre-implementation
**Format:** Claude Code plugin, open source (MIT)

## 1. Vision

Batuta is a lightweight orchestration framework for Claude Code. Claude acts as the
**conductor**: it classifies each task, chooses the cheapest executor capable of doing it,
assembles the context, delegates, verifies the result, and commits. The executors — coding
CLIs such as codex, opencode (using Kimi, DeepSeek, etc.) and Claude itself — are the
instrumentalists.

The goal is to replace heavyweight process frameworks (phases, agent chains,
mandatory artifacts) with a single lean cycle that preserves the guarantees that
matter: traceability through git, resumable state, planning when needed,
and verification every time.

v1 focuses on Claude Code as the orchestrator, but the conductor role is an
architectural position, not a dependency: the project direction is to allow
any tool to be configured as the orchestrator in the future. Design decisions
that couple the cycle (brief → delegate → verify → commit) to Claude should be
avoided whenever an alternative with equivalent cost exists.

## 2. Problem

Existing orchestration frameworks (e.g., GSD) provide discipline at the cost of:

1. **Process weight** — phases, dozens of agents, and mandatory artifacts even
   for small tasks.
2. **Token cost** — planner, checker, verifier, and executor all running on the
   most expensive model.
3. **Maintenance friction** — state in rigid-schema tables that break on
   an unescaped pipe; validations that block the workflow.

At the same time, the user has multiple compute sources with different costs
(Claude subscription, ChatGPT/codex subscription, pay-per-use APIs) and no
structured way to balance them.

## 3. Principles

1. **The one who conducts does not play** — the orchestrator spends tokens directing, not writing
   code. Code is written by the cheapest capable executor.
2. **The process weighs only as much as the task allows** — planning is adaptive,
   never a prerequisite.
3. **State is prose, not schema** — checkboxes and free text; nothing that breaks on
   a character.
4. **Every delivery goes through verification** — diff review, tests, and acceptance
   criteria, every time.
5. **Extensible by file, not by code** — adding an executor means copying an
   adapter template and filling it in.

## 4. Preserved guarantees (deliberate inheritance)

| Guarantee | How Batuta delivers it |
|---|---|
| Atomic commits | One verified task = one commit; enables a clean undo |
| Persistent state | One `WORK.md` per project, prose + checkboxes format |
| Plan before execution | Adaptive: inline by default, formal through `/batuta:plan` |
| Post-execution verification | Fixed cycle step: diff + tests + acceptance criteria |

## 5. Architecture

### 5.1 Plugin structure

```
batuta/
├── .claude-plugin/plugin.json
├── skills/
│   ├── batuta/            # main entry point — the cycle: classify, route, delegate, verify
│   ├── init/              # onboarding (first time) and reconfiguration
│   ├── plan/              # optional formal planning
│   ├── pause/             # pause with session handoff
│   ├── resume/            # resume by consuming the handoff
│   ├── status/            # display WORK.md and tasks in progress
│   ├── route/             # display/edit routing tables
│   └── review/            # rerun verification on any diff
├── routing.md             # default routing table (editable)
├── superpowers.md         # integration with superpowers: borrowed method, Batuta rules
├── codex-plugin.md        # integration with the codex plugin: borrowed muscle, Batuta rules
├── compozy.md             # integration with CompozyOS: delegation as a managed session
├── verification.md        # hardened verification: report ≠ evidence, test-hygiene scans, slop
├── runs.md                # execution trail: format and rules for .batuta/runs/
├── adapters/
│   ├── codex.md           # non-interactive invocation, context passing, limits
│   ├── opencode.md        # same, with configurable model (Kimi, DeepSeek, ...)
│   ├── claude.md          # the orchestrator itself executes
│   └── _template.md       # contract for new executors
├── templates/
│   ├── react.md           # stack conventions and rules for briefs
│   ├── nextjs.md
│   ├── react-native.md
│   ├── vue.md
│   ├── node-api.md
│   ├── nestjs.md
│   ├── python.md
│   ├── laravel.md
│   └── generic.md
├── docs/PRD.md
└── README.md
```

### 5.2 Per-project artifacts (created by Batuta in the user's repository)

```
<projeto>/
├── WORK.md                # lightweight state: in progress / done
└── .batuta/
    ├── profile.md         # project profile (first-run onboarding)
    ├── plan-<slug>.md     # formal plans, when they exist
    ├── worktrees/<slug>/      # temporary worktree per task (Worktree mode; ignored through .git/info/exclude)
    └── runs/<data>-<slug>.md  # per-task trail: brief, report, evidence, verdict (ignored through .git/info/exclude)
```

## 6. Features

### 6.1 Onboarding and reconfiguration (/batuta:init)

Onboarding is the first-run mode of `/batuta:init` (6–7 questions).
`/batuta` in a project without `.batuta/profile.md` points to init and stops — the
cycle never performs onboarding inline:

- **Project type / stack** — React, Vue, Node API, other (with automatic
  detection from package.json/composer.json, etc. as the default suggestion).
- **Methodology** — TDD or tests afterward; conventional commits or free-form;
  trunk-based or feature branches.
- **Test and build commands** — for the verification step.
- **Decomposed batches** — sequential (default) or parallel execution.
- **Worktree and installation** — per-task worktree mode (`off`/`medium+`/`always`,
  default `medium+`) and an optional installation command for the worktree
  test environment.

The result becomes `.batuta/profile.md`. The corresponding stack template
(`templates/react.md`, etc.) is referenced in the profile, and its conventions are
automatically included in every task brief sent to executors. The catalog is
adaptive with prohibitions: each template follows the `generic.md` pattern
(conventions that respect the project's pattern + a `Never:` block of
objective anti-patterns, capped at ~35 lines), with child→parent inheritance, and init
chooses the most specific applicable one (Next.js > React > generic). The
user can edit the profile at any time; `/batuta:init` in an already configured
project enters **reconfiguration** mode — it rechecks the executors
referenced by the table, shows the current mapping and profile, and rewrites
only what the user requests (lane/model, profile answers, map
resweep), without touching `WORK.md`.

The profile also gains a **project map**: 20–40 lines of prose (key
directories, where routes/components/tests live, entry points, what is generated and
must not be touched), filled in during onboarding — the scan is delegated to the scout (research lane,
§6.9) when mapped; the conductor scans it personally only if the lane does not exist or the
scout fails twice.
Maintenance is opportunistic: if the conductor discovers something missing from the
map while assembling a brief, it adds one line; there is never a "map update
phase." If the project has `CLAUDE.md`/`AGENTS.md`, the profile complements them without
duplication; a contradiction between those files and the profile is flagged to the user,
never edited — executors such as codex read `AGENTS.md` themselves, and
an unflagged contradiction becomes a conflicting instruction in the middle of the task.

**Takeover from another framework:** if onboarding detects artifacts from another
framework (`.planning/`, `TODO.md`, roadmaps), it offers a one-time import — work that
was in progress/done becomes lines in `WORK.md`, substantial remaining work
becomes `.batuta/plan-<slug>.md`, and relevant decisions become lines in the profile. The
old artifacts remain untouched.

**Executor checks and lane mapping:** onboarding runs the adapters'
availability checks, shows what it found, and proposes a lane mapping based on the
actual setup — the user has the final say, choosing which CLI/provider/model takes
each lane. Complete trio → default table, confirming the cheap model for trivial
(opencode) and the executor for complex — codex + strong model (default) or a strong
Claude model through a background instance, according to user preference. Without codex →
opencode covers trivial/medium, complex goes to strong Claude in the background, critical
stays with the session. Claude only → lanes differ by Claude model through a background
instance (`claude -p --model …`). The same proposal covers the research support lane (§6.9): a cheap
candidate from the same discovery (kimi/haiku/mini/nano/flash filter).
Everything is confirmed in a single question; the
result becomes the project's `.batuta/routing.md` — the local copy is created during
onboarding with explicit executors and models. A missing executor is reported
immediately, along with the lane collapse, instead of being discovered at the first delegation.

### 6.2 Routing by complexity

Default table (editable through the project's `routing.md` or `/batuta:route`):

| Complexity | Examples | Executor | Cost |
|---|---|---|---|
| Trivial | rename, config, text, simple unit test | opencode + cheap model | cents (API) |
| Medium | isolated feature, bugfix with clear reproduction | codex (default model) | ChatGPT subscription |
| Complex | multi-file work specifiable in a precise brief | codex + strong model, high reasoning | ChatGPT subscription |
| Critical | architecture, security, indispensable conversation context | claude (orchestrator executes) | Claude subscription |

- The orchestrator classifies independently and reports the decision in one line
  ("→ codex: medium bugfix"). The user can override it at any time
  ("use kimi for this").
- **Automatic escalation:** executor fails verification 2× → task moves up one
  executor level.
- **Explicit model:** in multi-model CLIs, the table row names the model;
  the conductor never uses the CLI's global default, which may point to an
  expensive model and silently defeat cost routing. Exception: codex under a
  subscription has a flat cost per task — the default is acceptable in the medium lane. In the
  complex lane, the exception does not apply: there the model is a capability control, so the
  row names an explicit model and reasoning effort (e.g., `codex -m gpt-5-codex,
  reasoning high`), confirmed during onboarding.
- **Complex vs Critical:** the boundary is the brief, not size. If a
  self-contained brief is possible (files, settled decisions, verifiable criteria)
  → complex, delegable to the lane's executor with a strong model. If it requires
  conversation context, security judgment, or open decisions → critical, stays with
  claude. When in doubt, critical: overclassification costs the price difference;
  underclassification costs a failed delegation cycle.
- **The complex-lane executor is the user's choice:** default codex + strong
  model, but onboarding offers the alternative of a strong Claude model through a
  background instance (`claude -p --model opus "<brief>"`). The variant's limit
  is context, not capability: the background instance cannot see the
  conversation, so it applies only to work that passes the brief test — work requiring
  the conversation remains critical and stays with the session, regardless of who owns
  the complex lane.

**Codex plugin as a means, not a lane:** with the Codex plugin installed in the
conductor's Claude Code, the codex route is invoked through the plugin's shared
runtime, briefs on that route follow its prompting method, an item
whose retry failed receives a `codex:rescue` diagnosis before escalation,
and complex/critical items receive cross-review before the verdict. Nothing
changes in the routing table: runtime detection, degradation to raw
`codex exec`, and the CLI availability check still apply
(plugin without a logged-in CLI = unavailable lane). Full map in
`codex-plugin.md` at the root.

### 6.3 Execution cycle (single, without phases)

A task is the smallest deliverable that can be verified and committed on its own.
A request with more than one deliverable (component list, plural scope) is
decomposed before the brief: each item goes through the entire cycle below and
ends in its own commit — sequential by default; `parallel` optional through the
profile, with a verbal per-task override. Coupled items that cannot be
verified separately remain a single task, as a declared exception in the
announcement. Failure of one item (even after escalation) skips that item and blocks only its
dependents; independent items continue.

1. **Brief** — the orchestrator assembles the task brief: objective, context, relevant
   files, profile/template conventions, acceptance criteria, scope (closed list of mutable paths).
2. **Delegate** — invoke the adapter through Bash (`codex exec …`, `opencode run …`).
3. **Verify** — scope check (`git diff --name-only` against the brief's list) + `git diff` review by the orchestrator + project tests +
   the brief's acceptance criteria.
4. **Commit** — atomic commit. Failure → 1 retry with feedback to the executor →
   level escalation.
5. **Record** — one line in `WORK.md` + task trail in `.batuta/runs/`.

**Per-task worktree:** when the profile's `Worktree` line is set
(`off`/`medium+`/`always`; default `medium+`, asked during init; profile without
the line = `off`), steps 2–3 happen in an isolated worktree
(`.batuta/worktrees/<slug>`, branch `batuta/<slug>`): the executor freely commits WIP,
verification reads the branch diff and runs tests there — with the
optional `Install:` line preparing the environment; without it, a declared fallback
in the main checkout — and integration is a squash merge performed by the conductor with
the methodology's message: WIP history never reaches main. Retry in the
same worktree; escalation resets the branch; definitive failure deletes the worktree and
branch while leaving main untouched. Under `medium+`, the trivial lane stays in the main
checkout.

### 6.4 Adaptive planning

- **Inline (default):** when faced with an ambiguous or large task, the orchestrator asks
  2–3 questions and sketches the plan as text in the conversation. No artifact.
- **Formal (`/batuta:plan`):** an approvable plan saved in `.batuta/plan-<slug>.md`,
  for work that spans sessions.
- A plan is never a prerequisite: a clear task goes straight to the cycle.

### 6.5 Parallelism

Independent tasks run in parallel: executors in the background
(Bash `run_in_background`). With the profile's `Worktree` line active, each
task already runs in its own worktree (see §6.1/6.3); when it is `off`, use one
git worktree per executor when there is a risk of file conflicts.

- **With superpowers installed:** conduct distribution according to the plugin's
  `superpowers.md` (which also covers brainstorming, planning,
  review, debugging, and the claude lane — superpowers method, Batuta
  rules).
- **Without superpowers:** fall back to Claude Code's native background tasks.
- Runtime detection; no hard dependency.
- Decomposed batches (§6.3) are sequential by default; parallelism is enabled
  through the profile's Execution line or a verbal request. Even in parallel,
  verification and commit happen per item.

### 6.6 State (`WORK.md`)

```markdown
# WORK — <projeto>

## In progress
- [ ] <tarefa> → codex (delegated 2026-07-19)

## Done
- [x] <tarefa> → kimi (moonshotai/kimi-k2), commit abc123
- [x] <tarefa> → codex (escalated from kimi after 2 failures), commit def456
```

Prose + checkboxes format. No rigid-schema tables, no strict validation.

The Done line tells the complete routing story: executor + model and
any retries/escalations. It is the project's conducting log —
`/batuta:status` aggregates on demand (tasks by lane, escalation rate,
delegation rate); no counter or metric is stored.

### 6.7 Commands

| Command | Function |
|---|---|
| `/batuta` | Main entry point: the cycle (classify, route, delegate, verify). Gates: no profile → point to init; pending handoff → offer resume |
| `/batuta:init` | Onboarding (first time) and reconfiguration (later) |
| `/batuta:plan` | Force approvable formal planning |
| `/batuta:pause` | Pause: honest `WORK.md` + session handoff |
| `/batuta:resume` | Resume from the exact point and consume the handoff |
| `/batuta:status` | Show `WORK.md` and background tasks |
| `/batuta:route` | Display/edit routing tables |
| `/batuta:review` | Rerun verification (step 3) on any diff |

### 6.8 Adapter contract

Each adapter in `adapters/*.md` defines:

- **Invocation:** exact non-interactive command (e.g., `codex exec --sandbox
  workspace-write "<brief>"`).
- **Context passing:** how to deliver the brief (argument, file, stdin).
- **Capabilities and limits:** recommended task size, what not to delegate.
- **Cost:** subscription or pay-per-use, for the routing table.
- **Availability check:** how to check whether the CLI is installed/logged in.

New executor = copy `_template.md`, fill it in, add a row to `routing.md`.

**Dormant adapters:** the table references them; the adapter sleeps. An adapter is only
read when its row is routed (delegation) or added to the table
(onboarding/`/batuta:route`) — there is never a scan of all adapters or
all CLIs on the machine. This is what keeps context cost constant
as the catalog grows: supporting cursor, copilot, kimi CLI, etc. is a
~50-line file that nobody pays to have, only to use. A non-negotiable
property when adding executors.

### 6.9 Support lane: research (the scout)

File research (where X lives, what touches Y, how Z is tested) is delegated
to a **support lane**, orthogonal to the complexity ladder: the *scout* — a
cheap, read-only executor defined in a second `routing.md` table
("Support lanes") and confirmed in the same single onboarding question. Three
triggers: map scan during onboarding, pre-brief context, and the user's
ad hoc questions about the codebase.

- A **report contract** with 4 fixed sections (answer; files with line numbers;
  evidence; uncertainties — mandatory) travels with every research brief: a small
  model follows the format literally.
- **Cheap structural verification** before consumption: cited paths through
  `ls`, symbols through `grep`. Phantom anchor → 1 retry with feedback; second
  failure → the conductor researches it personally. No ladder: the lane fallback is
  always the conductor.
- **Read-only guaranteed by the universal guard** (`git status --porcelain`
  before/after; dirty tree → revert and count as failure), with the CLIs' native
  modes (`codex --sandbox read-only`, tools blocked in
  `claude -p`) as defense in depth.
- Research does not write code, commit, or enter `WORK.md`.
- Background execution with fan-out: independent questions become parallel scouts
  while the conductor continues conducting.

### 6.10 Pause and resume (`/batuta:pause` / `/batuta:resume`)

`WORK.md` says *what* was in progress; the handoff says *where in the cycle* the
session stopped. `/batuta:pause` updates `WORK.md` with honest state, handles
background tasks, and writes `.batuta/handoff.md` in prose with 4 sections:
cycle point, decisions not yet written down, background, and pending items with the
user. `/batuta:resume` reads profile + routing + `WORK.md` + handoff, checks
git (the tree wins over the handoff when they diverge), summarizes the situation, confirms,
and resumes — absorbing the handoff into `WORK.md` and **deleting it**: it is a
passing note, not state. One handoff per project; pausing again overwrites it.
`/batuta` with a pending handoff warns in one line and follows the user's
choice — never auto-resumes.

## 7. Out of scope (v1)

- A dedicated installer or binary — distribution is through plugin marketplace/git.
- Dashboard, aggregate cost metrics, or telemetry.
- Phases, milestones, roadmaps, and chains of specialized agents.
- Orchestration of interactive CLIs (non-interactive/exec mode only).
- Executor credential management (each CLI handles its own login).
- Orchestrators other than Claude Code — in v1 the conductor is always Claude.
  This is a declared future direction (see §1); v1 only needs to guarantee that it does not
  couple the cycle to Claude in a way that makes later replacement impossible.

## 8. Success criteria

1. A trivial task delegated and committed with < 3 user interactions.
2. Claude cost per delegated task limited to brief + review (without code
   generation by the orchestrator on trivial/medium tasks).
3. Add a new executor without touching any skill (adapter + routing only).
4. `WORK.md` readable by a human and resumable by a new session without extra context.
5. Works both with and without the optional plugins (superpowers, codex plugin)
   installed.

## 9. Recorded decisions

| Decision | Choice | Rationale |
|---|---|---|
| Format | Claude Code plugin | Installable, versioned, a format the community uses |
| Orchestrator | Claude Code in v1; agnostic in the future | Initial focus on a single conductor; any configured tool should be able to assume the orchestrator role |
| Routing | Automatic with override | Less friction; the user retains verbal control |
| State | Prose + checkboxes | Rigid-schema tables were a source of breakage in GSD |
| Name | Batuta | Exact metaphor (conducting without playing), Brazilian, short, available |
| Commands | 5 (go, plan, status, route, review) | Minimal surface with cost control and manual verification |
| Onboarding | Automatic on first run | Stack/methodology profile feeds briefs without an extra command |
| Code map | Short prose section in `profile.md`, updated opportunistically | A formal map ages and becomes an incorrect reference; the real cost is rediscovering where things live, which a 20–40-line map solves |
| Takeover from another framework | One-time import during onboarding (state → `WORK.md`/plan/profile) | The work state needs translation, not the architecture; old artifacts remain untouched |
| Write boundary | Batuta writes only to `WORK.md`, `.batuta/`, and code through the cycle | Trust and surgical change: `CLAUDE.md`, `AGENTS.md`, and other tools' configs are read-only unless the user explicitly requests otherwise |
| `WORK.md` at the root | Project root, not inside `.batuta/` | The primary audience is human: at the root it invites editing (like a `TODO.md`) and can be resumed by any agent or colleague without knowing Batuta — state is not held hostage by the tool. `.batuta/` remains backstage for the conductor. Accepted cost: one more file at the root |
| Explicit model in routing | The table row names executor + model; onboarding checks executors and generates local routing | A multi-model CLI's global default is whatever state the user left there, not a choice — it may point to an expensive model and defeat cost optimization unnoticed. Codex under subscription is the exception (flat cost) |
| Dormant adapters | An adapter is read only when its table row is routed or added; onboarding checks only what the table references and never scans the machine for CLIs | Context cost must remain constant as the adapter catalog grows — with scanning, each new CLI (cursor, copilot, kimi CLI…) would make onboarding and classification more expensive for everyone, even those who do not use it |
| Lane mapping is the user's choice | Onboarding proposes lanes from installed executors, and the user confirms/adjusts which CLI/provider/model takes each one; partial setups become valid tables (Claude only → lanes by Claude model) | The default table assumes the complete trio, but actual setups vary; imposing the default on someone with only claude or claude+opencode would break routing on the first task. The user decides; Batuta discovers and suggests |
| Complex lane delegable to codex | The table gains 4 bands: complex (codex + strong model, high reasoning) separated from critical (claude); the boundary is a self-contained brief, not size | Under a ChatGPT subscription, cost per task is flat — a strong model in complex supplies capability at no extra cost, reserving Claude (the more expensive lane) for work that truly requires conversation context or judgment. When in doubt classify as critical: overclassification costs a price difference; underclassification costs a failed delegation cycle |
| Claude variant in the complex lane | Onboarding offers mapping complex to a strong Claude model through a background instance (`claude -p --model opus`) as an alternative to codex + strong model; critical always remains with the session | Heavy logic that passes the brief test does not need the session's model — a strong Claude in the background solves it more cheaply, and some people prefer Claude to codex for that work. The limit is context, not capability: a background instance cannot see the conversation, so the variant never absorbs critical |
| Scout (research lane) | Second "Support lanes" table in `routing.md` with a cheap read-only executor for map scanning, brief context, and ad hoc questions; fixed report contract, structural verification (`ls`/`grep`), git guard, and fallback to the conductor | Research was paid for by the session's expensive model; a cents-priced background model returns the distilled result. Orthogonal to the ladder (failure does not escalate — it returns to the conductor); the silent failure mode of a small model (invented reference) is covered by structural verification, which costs cents and brings no content into premium context |
| Revised command surface | 8 commands: `/batuta` (cycle only, with gates) + init (onboarding/reconfiguration as the only path), pause/resume (temporary handoff), and renamed plan/status/route/review without a prefix | The main skill accumulated setup + cycle and offered no way to reconfigure or pause; the real command (`plugin:skill`) diverged from the documentation. Revises the decisions "Commands: 5" and "Automatic onboarding on first run" (onboarding now lives in `/batuta:init`). Breaking rename accepted in 0.x with one user; CHANGELOG provides notice |
| Conducting decision record | A `WORK.md` line carries executor + model + escalations; aggregation only on demand in `/batuta:status` | Value is demonstrated with facts (delegation rate, escalation rate), not invented accounting — Batuta cannot know every CLI's tokens or prices. Monetary values only if the user supplies reference prices in the routing table. Telemetry remains out of scope |
| Languages | Instructions for tools (skills, adapters, templates, routing) in English; user docs (README, PRD) in Brazilian Portuguese | Models follow instructions better in English; the target audience (Brazilian developers) reads the documentation in Brazilian Portuguese |
| Decomposition in the cycle | Step 1.5: a multi-deliverable request becomes N tasks (smallest verifiable and committable unit), full cycle and commit per item; sequential by default with `parallel` in the profile; announce and execute without pausing for confirmation | Real-use feedback (2026-07-20): the entire list became one brief and one final commit — the atomic commit of §6.3 holds only if decomposition defines "one task," and per-item verification prevents one failure from contaminating the batch |
| Integration with superpowers | Central `superpowers.md` document at the root; automatic runtime detection, no toggle; superpowers method, material Batuta rules (artifacts, routing, verify/commit per item); conditional method line in every brief for executors that have superpowers | Mature process skills improve conducting without creating a dependency: when the plugin is absent, each step follows the skill's baseline text; external executors degrade on their own by ignoring the brief condition |
| Per-task worktree | Executor commits WIP in its own worktree (`.batuta/worktrees/<slug>`, branch `batuta/<slug>`); conductor verifies on the branch and integrates by squash using the methodology's message; profile gains `Worktree` (`off`/`medium+`/`always`, default `medium+`) and optional `Install:`; local ignore through `.git/info/exclude` | Real isolation: main is never dirty, and rejection means deleting the worktree, not reverting; squash preserves the atomic commit and the conductor's authority over the message; the lane gate avoids ceremony for trivial tasks; local exclude respects the write boundary (`.gitignore` belongs to the user) |
| Integration with the codex plugin | Central `codex-plugin.md` document at the root; automatic runtime detection, no toggle; four roles: prompting method in the brief, transport through shared runtime, pre-escalation `codex:rescue` diagnosis, automatic cross-review only for complex/critical; plugin never decides routing or verdict | Same authority contract as superpowers: borrowed muscle improves the codex route without creating a dependency — when the plugin is absent, the cycle degrades to the adapter's `codex exec`; cross-review restricted to expensive lanes keeps trivial/medium fast |
| Templates by stack (expanded catalog) | Nine adaptive templates (`generic`, `react`, `nextjs`, `react-native`, `vue`, `node-api`, `nestjs`, `python`, `laravel`), each ≤ ~35 lines with a `Never:` block of objective, diff-verifiable anti-patterns; child→parent inheritance without repetition; init chooses the most specific | An explicit convention in the brief prevents the cheap executor from inventing its own pattern; adaptive rules ("the project decides") age slowly, and objective prohibitions are the rule category that most improves small-model accuracy |
| Hardened verification | Central `verification.md` document at the root (the same dormant pattern); executor report is never evidence — each criterion is rerun using the smallest public proof; descriptive test-hygiene scans in the diff (added skip, weakened assertion, mock hiding a real dependency, unjustified snapshot = failure; happy path only = feedback); slop checklist inside diff review | Real-use symptom: executor declares completion without the diff supporting it (failed atomic commits); descriptive scans cost one grep and age slowly because they are stack-agnostic; distilled from `agent-output-audit` and `deslop` in pedronauck/skills — distillation spec in `docs/superpowers/specs/` |
| Hardened brief | Two new brief sections (Step 2): Expected evidence (what the executor reports — files, commands with real output, declared uncertainty; Step 4 checks it, never trusts it) and Stop conditions (when to stop and report instead of improvising); conditional test laws in the brief when criteria involve tests; sweep for leaked "how" in medium+ lanes (cheap lanes retain intentional prescription); explicit gap `Unknown — <motivo>`; anti-workaround as a `Never:` item in `templates/generic.md` with a `// WORKAROUND: <motivo>` escape valve judged during verification | Feeds hardened verification with checkable material (promised evidence vs. diff) and cuts off the cheap executor's two failure modes: improvising when faced with the unexpected and silencing a signal instead of fixing its source; distilled from the delegation packet (`herdr-orchestration`), `to-prompt`, `no-workarounds`, and `testing-boss` in pedronauck/skills |
| Cross-review contract | "Cross-review contract" section in `verification.md`, valid for any transport: lenses scale with the diff (<50 lines = 1, ≤200 = 2, above = 3 — Skeptic, Architect, Minimalist, in a single dispatch), findings as a file outside the repository (a round without a file is invalid; stdout is operational evidence), contract parity (an item implementing a spec carries the artifact verbatim, never a paraphrase), and conductor judgment (accept/reject each finding with a one-line rationale; accepted = normal verification failure) | An adversarial reviewer produces false positives by design — explicit judgment prevents retrying on a poor finding; contract parity prevents the incident documented in the source (7 SHIP rounds contradicting the spec that no round read); a file outside the repository preserves the dispatch's read-only guard; distilled from `adversarial-review` and `impl/spec-peer-review` in pedronauck/skills |
| Versioned retrospective protocol | `docs/qa-retro.md`: in-persona dogfooding through Batuta's public surfaces; 3 non-negotiables (in persona, evidence not optimism, write back), stall-is-a-finding (record it, never fix it mid-session), 6 journeys with true final state mapped to §8, a 5-tier impact rubric, deduplication of rediscovered findings, and closure with a declared coverage cutoff; results of each round stay with the test subject | The protocol is Batuta's reusable methodology (operationalizes §8) and evaporates if it lives only in the retrospective conversation; protocol-here/results-there separation mirrors the product vs. test-session boundary; distilled from `qa-execution`/`qa-report` in pedronauck/skills |
| Declared scope in the brief | Scope field (closed list of mutable paths) paired with negative Boundaries; mechanical `git diff --name-only` check against the list as the first Step 4 action — a path outside the list fails even if the code is correct; expanding the list is the conductor's decision during rebriefing, never the executor's | Boundaries says what to avoid, but does not delimit where to work — an executor without declared reach invents its own; the path check is the cheapest verification and catches spillover before content review; a candidate cause of failed atomic commits observed in real use; distilled from CompozyOS policy-filtered tools — spec in `docs/superpowers/specs/` |
| Execution trail | `.batuta/runs/<data>-<slug>.md` per verified task (and per aborted task): brief verbatim, executor report verbatim, reproduced evidence, and verdict; written in Step 5; `WORK.md` only points to it; local through `.git/info/exclude`; format and rules in the dormant root `runs.md`; judged cross-review findings are recorded there | "Declared ≠ verified" requires evidence, but it evaporated with the session — the retrospective judged from memory, and symptoms such as failed atomic commits lacked diagnostic material; verbatim because summarizing loses evidence; it is not memory (the conductor does not read it during the cycle); distilled from CompozyOS per-session transcript — spec in `docs/superpowers/specs/` |
| Compozy runtime integration | Dormant root `compozy.md` (superpowers/codex-plugin pattern); two triggers: `COMPOZY_SESSION_ID` in the environment = automatic with precedence (a conductor running through Compozy always dispatches through it), otherwise a `Runtime: compozy` profile line offered by init; delegation as a managed session with native provider (claude/codex/opencode) and table flags mapped 1:1 (`--provider/--model/--reasoning-effort`), sessions named `batuta/<slug>`; batches in waves of ≤ 5 children; report through `session history`; fallback to subprocess with a warning | A durable-session host provides a transcript per executor, parallelism that survives the terminal, and policy per workspace without changing a comma in the cycle; automatic inside the daemon because launching Batuta through Compozy is already the user's choice, and a subprocess from there would hide the instrumentalists; `WORK.md` + `.batuta/runs/` remain the source of truth (state is not held hostage by the host); CompozyOS distillation verified against the local CLI — spec in `docs/superpowers/specs/` |
| Compozy task board | New sections in dormant `compozy.md` (same runtime triggers, no new profile line): each `WORK.md` item becomes a Compozy task (`--identifier batuta/<slug>`, same slug as the session; dependencies and child tasks follow the plan), and each delegation becomes a task run through the operator path (`task run enqueue/attach-session/start/complete/fail` + `task retry`), uniform inside and outside the daemon — session-bound claim (`task next`/`heartbeat`) discarded, verified in the CLI: it requires managed identity and would tie the lease to the conductor session; `complete` only after Step 4 verification; blocks as typed `task block`; trail records the task id; one-way `WORK.md` → board sync, best-effort with a warning | The daemon Kanban (`compozy open`) now shows the plan with **verified** state, not self-reported state — the conductor drives every transition and the executor never touches the board; `WORK.md` remains the sole source of truth (the board is a lens; divergence resolves in favor of the text); approvals, channels, Memory, and automation remain for their own specs; spec in `docs/superpowers/specs/2026-08-01-compozy-tasks-design.md` |
