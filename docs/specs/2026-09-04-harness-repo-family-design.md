# Batuta as a multi-CLI harness — the repo family — design

**Date:** 2026-09-04 · **Status:** approved; phases 1–3 delivered the same day

## Context

Batuta existed as three repositories that did not inherit from each other:

| Repo | What it was | State on 2026-09-04 |
|---|---|---|
| `franciscpd/batuta` | Claude Code plugin in prose (skills, adapters, templates, routing) | 0.2.14; depended on `superpowers`, the Codex companion plugin and CompozyOS through dormant files |
| `franciscpd/batuta-compozy` | Go CompozyOS extension (agent, routing skill, three Loops, nine tools, executor inventory, delivery graph) | `main` at beta.3; the real work sat on a hardening branch, 153 commits ahead, at beta.6 |
| `franciscpd/batuta-cli` | Rust TUI for the Compozy daemon | beta.7 |

The opinion of Batuta — the essence — was the same in all three, but duplicated
and drifting: the plugin classified in `trivial/medium/complex/critical`, the
extension in `low/medium/high/critical × domain`; the plugin had `WORK.md` and
prose adapters, the extension a journal, wave graph and inventory in Go.

Goal: a family of repositories under the `batuta-ai` organization that
complement and inherit from each other, producing an installable for every CLI
(Claude Code, Codex, opencode, Cursor, Antigravity, any `npx skills` host) and
for CompozyOS, with no third-party plugin dependency and the essence intact.

## The essence (what never changes between hosts)

1. **The conductor does not play** — it classifies, briefs, delegates, verifies, commits. It never writes product code, except on the critical lane where the host itself is the executor.
2. **Routing by cost × complexity** — inventory of what is installed, a table per lane, verbal override by the user, automatic escalation after a retry.
3. **One item = one commit** — decomposition before the brief; verification and commit per item.
4. **Verification always, reported exactly** — declared is not verified; every delivery passes the gates; a terminal outcome is never rounded up to success.
5. **State is prose** — `WORK.md` + `.batuta/` on hosts without a daemon; the Compozy journal where there is one. Both human-readable.
6. **Extensible by file** — a new executor is a new adapter markdown file.

## The family: four active repositories, one archived

```
batuta-ai/skills    doctrine + skills (agentskills.io). Pure markdown. npx skills add batuta-ai/skills
batuta-ai/core      Go: delivery graph, journal, inventory, git integration, gates, executors by adapter;
                    the `batuta` binary (doctor, inventory, gate, trail, loop)
batuta-ai/batuta    file hosts: Claude Code / Codex / Cursor / opencode manifests, hooks, commands,
                    bin/install.js; vendors the skills at a tag; installs the core binary
batuta-ai/compozy   CompozyOS extension: extensionapp (SDK) + Loops + AGENT.md generated from the skills;
                    depends on core as a Go module
batuta-ai/cli       archived
```

### `batuta-ai/skills` — the doctrine as skills

A pure-markdown repository in the agentskills.io format, the common denominator
of every host. The doctrine lives inside the skills as `references/`:

```
skills/
  batuta/
    SKILL.md                    the cycle, ~90 lines
    references/
      brief.md                  Goal/Context/Conventions/Criteria/Boundaries/Scope/Evidence/Stop
      verification.md           declared ≠ verified, four gates, hygiene scans, slop, cross-review
      routing.md                lanes low/medium/high/critical × domain; support lane (scout)
      state.md                  WORK.md, run trail, handoff, stamps
      scout.md                  research delegation with a scoped-write contract
      worktree.md               per-task worktrees and parallel batches
      method/clarify.md         replaces superpowers:brainstorming
      method/debug.md           replaces systematic-debugging
      method/no-workarounds.md  gate + escape valve with // WORKAROUND:
    adapters/                   self, claude, codex, opencode, cursor-agent, agy, _template
    templates/                  per stack (unchanged)
    agents/openai.yaml          Codex interface
  batuta-init/  batuta-plan/  batuta-loop/  batuta-review/  batuta-status/  batuta-route/  batuta-pause/  batuta-resume/
tests/skills/check.sh           lint and token budget, CI gate
```

Rules:

- No skill names a host tool. "The runtime's question tool", "the runtime's background facility"; without one, ask in the message and stop.
- Every step ends with a checkable *Done when*. Dormant references enter through a strong pointer. References over 100 lines open with `## Contents`.
- Heavy skills (`init`, `plan`, `loop`, `status`, `route`, `pause`, `resume`) are user-invoked (`disable-model-invocation: true`). Only `batuta` and `batuta-review` are model-invoked, so the resident cost per session is two descriptions.
- The `self` adapter means "the conducting host executes" (critical lane). Under Claude Code, `self` is the Claude session and `claude.md` is a background `claude -p`; under Codex, `self` is the Codex session and `codex.md` a background `codex exec`.
- Adapters carry a machine-readable YAML frontmatter (`run`, `readonly`, `available`, `models`, `finished`, `limit_regex`, `cwd_flag`). The core reads the frontmatter; the conductor reads the prose.
- Token budget is enforced: `batuta/SKILL.md` ≤ 120 lines, other skills ≤ 60, descriptions ≤ 300 characters. The main skill dropped from ~4,600 to ~1,400 resident tokens.

### `batuta-ai/core` — the muscle in Go

Extracted from the extension's hardening branch with its history. The packages
`routing` (delivery graph, journal, domain × complexity selection, ownership,
classification, artifacts), `inventory` (executor probes), `integration`
(candidate and canonical integration through git), `publication` (push, PR,
verification) and `repository` **do not import the Compozy SDK** — they are
plain Go over `git`, `gh` and the executor CLIs. Only `extensionapp` and
`worktreeops` know the daemon, and they stayed in the extension.

```
core/
  routing/  inventory/  inventory/adapters/  integration/  publication/  repository/   as extracted
  cmd/batuta/       version · inventory (redacted executor snapshot) · doctor (executors, git, skills)
  roadmap:
    journal/        Store interface + file implementation (.batuta/journal/<delivery>.jsonl)
    worktree/       Provider interface: GitProvider on hosts, DaemonProvider in the extension
    executor/       Executor interface: SubprocessExecutor reads the adapter frontmatter; LoopExecutor in the extension
    gates/          engine finished · tree changed · tests outside the session · read-only verifier
    cmd/batuta      gate · trail · loop (--dry-run, --resume, --answer, --dashboard)
```

The module is pre-release: `v1.1.0-beta.N` until the API stabilizes (`v1.0.0`
and `v1.0.1` are retracted; they were published before the beta line). The
binary is distributed by `go install` today and by GitHub Release later.

### `batuta-ai/batuta` — the file hosts, one repository

One repository for Claude Code, Codex, Cursor and opencode because they all
consume the same `skills/<name>/SKILL.md` and differ only in the manifest at
the root. One repository per host would multiply vendoring and releases.

| Host | Manifest | Extra | Install |
|---|---|---|---|
| Claude Code | `.claude-plugin/plugin.json` + `marketplace.json` | `hooks/hooks.json` (SessionStart, one line), `commands/` thin routers | `claude plugin marketplace add batuta-ai/batuta && claude plugin install batuta@batuta` |
| Codex | `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json` | `agents/openai.yaml` per skill | `codex plugin marketplace add batuta-ai/batuta` → `codex plugin add batuta@batuta` |
| Cursor | `.cursor-plugin/plugin.json` + `marketplace.json` | — | `npx skills add batuta-ai/skills -a cursor -g` |
| opencode | `hosts/opencode/commands/*.md` | copied by the installer | `npx skills add batuta-ai/skills -a opencode -g` |
| Antigravity, any other | — | — | `npx skills add batuta-ai/skills -g` |

`skills/` is a vendored copy of `batuta-ai/skills` at the tag in
`skills-lock.json` (`scripts/sync-skills.sh <tag>` refreshes it; `tests/check.sh`
fails when the tree hash drifts from the lock). `bin/install.js` detects hosts,
runs each native path, copies the opencode commands and installs the core
binary with `go install` when Go is present; `--dry-run`, `--only <host>`,
`--list`. It runs with `npx -y github:batuta-ai/batuta`.

### `batuta-ai/compozy` — the host with a daemon

Still the Go extension, but thinner: `routing`, `inventory`, `integration`,
`publication` and `repository` come from core; `extensionapp` (SDK tools),
`worktreeops` and the new `internal/compozyclient` (the Compozy CLI client that
shared the publication package) stay. Next: `agents/batuta/AGENT.md` and
`resources/skills/batuta-routing/SKILL.md` generated from the skills through a
sync script, with a drift test requiring the essence's anchor sentences
verbatim.

### `batuta-ai/cli` — archived

A TUI over the daemon that Compozy covers with `compozy open` and its own CLI.
High cost (Rust, a contract pinned to a Compozy commit, drift on every beta)
for marginal value. Archived with a README notice; history preserved.
Archiving frees the name `batuta` for the core binary.

## The loop: reusing the Compozy graph on CLI hosts

The extension had two distinct engines, and the answer differs for each:

- **Delivery graph (`routing/graph.go`, pure Go):** reusable as is. It models tasks, dependency-safe waves of at most four, candidates, canonical integration, conflict re-execution, human pauses, budgets and cleanup. It does not depend on the daemon. It is now `core/routing`.
- **Loop engine (`loop.yaml`: fan-out, `run-loop`, `stop_when`, budgets, terminal states, durability, pause/resume):** lives inside the daemon; not a library. Not reusable on CLI hosts.

So `batuta loop` in core is a **runner of its own over the same
`DeliveryGraph`**: `prepare_wave` → up to four executors in git worktrees
through their adapters → `record_candidate` → canonical integration → one
review → publication. It is the Ralph loop driven by the Compozy graph instead
of a phase list, with the same invariants. Under Compozy, `batuta-deliver-core`
remains the runner with `LoopExecutor` and `DaemonProvider`.

| Lost without a daemon | Mitigation |
|---|---|
| Durability beyond the terminal | file journal, replay-safe; `batuta loop --resume <delivery>` continues from the last journaled operation |
| Typed `ask` resuming the same worktree | the task parks: journal `waiting_input`, question in `.batuta/asks/<task>.md`, `batuta loop --answer <task>` resumes in the same worktree |
| Sessions in a UI | `batuta loop --dashboard` (TSV state, one writer per file) |
| Daemon tool policy | the executor's own sandbox plus gate 1 as the guard |

Modes after this work:

| Mode | Who conducts | Hosts |
|---|---|---|
| `/batuta` interactive | the host's model, item by item | all |
| `batuta loop` | the mechanical conductor in core over an approved plan | file hosts |
| `batuta-deliver` | the daemon, same graph, durable | Compozy |

## Unified taxonomy

Compozy's: complexity `low/medium/high/critical` and domains `backend, frontend,
mobile, data, infra, security, testing, docs, general, fullstack`. The prose
plugin migrated from `trivial/medium/complex/critical`; "complex vs critical is
the brief test" became "high vs critical is the brief test". `batuta-init` in
reconfigure mode migrates an old `.batuta/routing.md`.

## What was removed from the old plugin

- `superpowers.md`, `codex-plugin.md`, `compozy.md` and every pointer to them.
- `docs/superpowers/` (specs and plans moved to `docs/specs-history` and `docs/plans-history`; the v1 PRD to `docs/specs-history/PRD-v1.md`).
- The conditional method line in briefs. The brief carries the method directly: test-first from the criteria, root cause before a fix, no silent workaround.
- `codex:rescue` and the cross-review through the Codex plugin. Cross-review remains, transport-agnostic: the second reviewer is any executor from the table, invoked read-only, findings in a file outside the repository.

## What came from beer-and-code-harness

| Mechanism | Where |
|---|---|
| Four mechanical gates | `references/verification.md`; `core/gates` on the roadmap |
| Fix cycle with the real cause in the re-brief | retry feedback |
| Preflight before spending tokens | `batuta doctor`, `batuta loop --dry-run` |
| Test command detection by manifest | `batuta-init` |
| sha256 stamps (explicit, never blocking staleness) | `profile.md` → `routing.md` → plan |
| Self-checks "run until green" | `batuta-init`, `batuta-plan` |
| Thin router + verification on disk | `commands/` |
| Drift guard for duplicated text | skills → hosts, skills → compozy |
| Mock-engine test suite | core, roadmap |

Out: the four-document `/init` chain, GEARS, `/ai-context`. Process weight
Batuta exists to avoid; Compozy already ships `spec-cycle` for a full SDD.

## What came from pedronauck/skills

| Idea | Where |
|---|---|
| Rent test and scope ladder | the `AGENTS.md` pointer block and every skill description |
| *Done when* per step, strong pointers, `## Contents` | every skill |
| Scoped-write contract | scout and cross-reviewer |
| Findings file as the source of truth | cross-review, scout reports |
| Delegation packet with stop conditions and expected evidence | the brief |
| Iron laws of testing, no-workarounds with an escape valve | `method/no-workarounds.md`, `templates/generic.md` |
| Learnings ledger from rejected findings | `.batuta/learnings.md` |
| `agents/openai.yaml` per skill; `disable-model-invocation` on heavy skills | `batuta-ai/skills` |
| `skills-lock.json` with a computed hash | vendoring in `batuta` and `compozy` |

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Repositories | `batuta-ai/{skills, core, batuta, compozy}`; `cli` archived |
| 2 | Skills separate from the doctrine? | No: the doctrine is the skills' `references/` |
| 3 | File hosts | one repository, N manifests at the root |
| 4 | Muscle | Go (`core`), extracted from the extension |
| 5 | Taxonomy | Compozy's |
| 6 | Loop on CLI hosts | a runner of its own over the core `DeliveryGraph` |
| 7 | Inheritance | skills → batuta and compozy by vendored copy + lock + drift test; core → compozy as a Go module; core → batuta as a binary |
| 8 | Versions | skills 0.4.0; batuta 0.3.0 next; core `v1.1.0-beta.N`; compozy continues from beta.6 |
| 9 | Language | everything persisted in the repositories is English; READMEs carry a PT-BR mirror |
| 10 | Gemini CLI | dropped (discontinued); Antigravity (`agy`) takes its place |

## Phases

1. **Skills** — done: extracted with history, integrations removed, method inlined, unified taxonomy, *Done when*, adapter frontmatter, token budget.
2. **Core** — done: hardening merged into `main`; daemon-free packages extracted; `batuta` binary with `version`, `inventory`, `doctor`; compozy depends on core.
3. **Hosts** — done: manifests for Claude Code, Codex, Cursor, opencode; `bin/install.js`; vendored skills with lock; CI. Pending: retro J1–J6 on each host installed on the maintainer's machine.
4. **Loop** — `batuta loop` over the graph, `--resume`, `--answer`, `--dashboard`; `journal`, `worktree`, `executor`, `gates` packages.
5. **Compozy inherits the skills** — `AGENT.md` and `batuta-routing` generated from the skills; drift test.

## Acceptance

- Install Batuta on every host in the table with the table's command and complete J1 (init → trivial cycle → atomic commit in fewer than three interactions).
- No file in `skills` or `batuta` mentions `superpowers`, `codex-plugin` or `compozy.md` outside history documents.
- `batuta loop` delivers a three-task plan with a dependency in a guinea-pig repository: three commits, canonical integration, a single review, replay-safe journal (`--resume` after a kill mid-wave).
- `compozy` passes the drift test against the skills tag in its lock and compiles against the core tag.
- Core compiles without the Compozy SDK; only `compozy` imports `github.com/compozy/compozy/sdk/go`.
