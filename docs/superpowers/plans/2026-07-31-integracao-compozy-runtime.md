# Integração Compozy runtime — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `docs/superpowers/specs/2026-07-31-integracao-compozy-runtime-design.md`: a dormant root reference `compozy.md` that routes the cycle's delegations through CompozyOS managed sessions, with two activation triggers (automatic when `COMPOZY_SESSION_ID` is set; profile opt-in `Runtime: compozy`), plus one conditional pointer line in each affected skill and the PRD records.

**Architecture:** Same integration pattern as `superpowers.md`/`codex-plugin.md`: all detail lives in the dormant root file; `skills/batuta` (Step 3), `skills/status` and `skills/init` each grow one conditional sentence pointing at it. The cycle, routing authority, verification and commit rules are untouched.

**Tech Stack:** Markdown only. Verification = grep/read checks; CLI facts already verified against the locally installed `compozy` (see spec, "Verificações feitas").

## Global Constraints

- Skills and root references in **English**; PRD in **PT-BR** (PRD §9, Idiomas).
- Each skill grows ≤ 1 conditional sentence (spec aceite); every operational detail lives in `compozy.md`.
- Exact names: root file `compozy.md`; env var `COMPOZY_SESSION_ID`; profile line `Runtime: compozy | direto` (no line = `direto`); session naming convention `batuta/<slug>`.
- Precedence rules (spec): managed-maestro trigger wins over the profile; when active, the delegation row supersedes the codex plugin's transport row — the plugin's prompting/rescue/cross-review roles are unaffected.
- Degradation is loud, never silent: daemon down or policy-refused dispatch → subprocess per the adapter, with a warning.
- No new command, no routing change, no commit-format change; `WORK.md` + `.batuta/runs/` remain the source of truth.

---

### Task 1: `compozy.md` dormante + linha condicional no Step 3

**Files:**
- Create: `compozy.md` (plugin root, sibling of `codex-plugin.md`)
- Modify: `skills/batuta/SKILL.md` (Step 3, after the codex-plugin transport sentence)

**Interfaces:**
- Produces: root file named exactly `compozy.md` with rows named "delegation row", "parallelism row", "status row" (referenced by Task 2's skill pointers); session naming convention `batuta/<slug>`.

- [ ] **Step 1: Create `compozy.md` at the plugin root**

```markdown
# Compozy runtime — managed sessions for the cycle's delegations

How the maestro dispatches executors through
[CompozyOS](https://www.compozy.com) when it is present. Dormant like the
adapters: skills point here in one line; read this file only when the
runtime is active. The cycle itself never changes — Compozy swaps how the
executor runs and where the report comes from, nothing else.

## Activation and precedence

Two triggers, checked in order:

1. **Managed maestro — automatic.** `COMPOZY_SESSION_ID` present in the
   environment means this session is Compozy-managed; every delegation
   goes through Compozy (child sessions), regardless of the profile. The
   user chose the runtime by launching Batuta through it — subprocess
   delegation from inside would hide the instrumentists from the daemon.
2. **Profile opt-in.** `Runtime: compozy` in `.batuta/profile.md`
   (offered by `/batuta:init` when the daemon is detected; no line =
   `direto`).

Neither trigger → subprocess per the adapter, as always. Daemon down or a
dispatch refused by policy → fall back to subprocess **with a loud
warning**, never silently; the cycle must not fail for Compozy's absence.

When active, this file's delegation row takes precedence over the codex
plugin's transport row (Step 3): a codex-lane delegation runs as a
Compozy session with `--provider codex`. The plugin's other roles
(prompting method, `codex:rescue`, cross-review) are unaffected.

## Map — cycle moment → runtime behavior → what Batuta keeps

| Cycle moment | Runtime behavior | What Batuta keeps |
| --- | --- | --- |
| Delegation (Step 3) | executor runs as a managed session, native provider | routing row's executor+model+reasoning; the brief; worktree placement |
| Parallel batch (Step 1.5/3) | one session per item, waves of ≤ 5 | decomposition, per-item verify/commit |
| Result collection (Step 3→4) | report read from the session transcript | report ≠ evidence (`verification.md`); the trail records the session id |
| Status (`/batuta:status`) | daemon sessions listed alongside background tasks | `WORK.md` as the source of truth |
| Pause/resume | session ids in the handoff; sessions survive the terminal | the handoff contract of `/batuta:pause` |

## Delegation row

Name every session `batuta/<slug>` — status and resume find them by name.

**Maestro outside the daemon** (profile trigger): one call carries
everything —

    compozy session new \
      --cwd "<task dir — the worktree when Worktree mode places one>" \
      --provider <routing row executor> --model <row model> \
      --reasoning-effort <row effort, when the row names one> \
      --name "batuta/<slug>" \
      --prompt "<the brief, verbatim>" -o json

**Managed maestro** (`COMPOZY_SESSION_ID` set): spawn a child, then send
the brief —

    compozy spawn --agent <agent> --provider <executor> --model <model> \
      --name "batuta/<slug>" --ttl-seconds <TTL> \
      --workspace-path "<task dir>" -o json
    compozy session prompt <child id> "<the brief, verbatim>"

`--ttl-seconds` is mandatory on spawn: default to 3600 for a single task;
scale up for a long batch, never unbounded. Child permissions are ⊆ the
parent's — if the workspace policy blocks the executor CLI, the dispatch
fails; that is a setup problem to surface, not to work around.

**Wait and collect:** `compozy session wait <id>`, then read the
executor's report from `compozy session history <id> -o json` (confirm
the exact JSON shape on first use; `compozy session recap <id>` is the
fallback summary). The report feeds Step 4 exactly like subprocess
output: it is never evidence. The run trail (`runs.md`) records the
session id as the replay reference.

## Parallelism row

Each batch item gets its own session (child sessions when managed). The
spawn default caps children at 5 per parent — run larger batches in
waves of ≤ 5 and say so. Sessions survive the terminal: `/batuta:pause`
records the ids in the handoff; `/batuta:resume` reattaches
(`compozy session status <id>`, `wait`, or `resume`).

## Status row

`/batuta:status` also lists the project's `batuta/*` sessions
(`compozy session list -o json`, filtered by name) with their state,
alongside background tasks and worktrees. `WORK.md` remains the source
of truth; the daemon is a lens.

## Setup prerequisites (init)

- `compozy` on PATH and the daemon responding (`compozy session list`
  answers) before offering the profile line.
- The workspace policy must allow the executor CLIs the routing table
  names; when a dispatch is refused, tell the user which policy blocked
  it instead of degrading silently.
```

- [ ] **Step 2: Add the conditional pointer to Step 3**

In `skills/batuta/SKILL.md`, Step 3, first paragraph currently ends: "...goes through the plugin's shared runtime instead of raw `codex exec` (`codex-plugin.md`, delegation row) — the row's model flags still apply." Append to the same paragraph:

```markdown
With the Compozy runtime active (`compozy.md` — automatic when
`COMPOZY_SESSION_ID` is set, profile `Runtime: compozy` otherwise), every
delegation runs as a managed session per its delegation row, which also
supersedes the codex plugin's transport.
```

- [ ] **Step 3: Verify**

Run: `grep -n "compozy" skills/batuta/SKILL.md` — expected: only the Step 3 pointer (one sentence).
Run: `grep -c "" compozy.md` — expected: ~115 lines; and `grep -n "delegation row\|parallelism row\|status row\|COMPOZY_SESSION_ID\|batuta/<slug>" compozy.md` shows all named anchors.

- [ ] **Step 4: Commit**

```bash
git add compozy.md skills/batuta/SKILL.md
git commit -m "feat: integração Compozy runtime — compozy.md dormante e delegação como sessão gerenciada"
```

(Body: two sentences — the two triggers and what the delegation row does; reference the spec file; end with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.)

---

### Task 2: init + status + PRD

**Files:**
- Modify: `skills/init/SKILL.md` (First run, step 2's question list)
- Modify: `skills/status/SKILL.md` (item 2)
- Modify: `skills/pause/SKILL.md` (where the handoff records background tasks)
- Modify: `docs/PRD.md` (§5.1 tree; §9 decisions table)

**Interfaces:**
- Consumes: `compozy.md` row names and the profile line `Runtime: compozy | direto` from Task 1.

- [ ] **Step 1: Add the Runtime question to init**

In `skills/init/SKILL.md`, First run, step 2's bulleted question list, after the "Install command?" bullet, add:

```markdown
   - Runtime? (only when the `compozy` CLI is on PATH and its daemon
     responds — offer `Runtime: compozy` vs `direto` (default); with
     `compozy`, delegations run as managed sessions per `compozy.md`;
     omitted otherwise)
```

- [ ] **Step 2: Add the status pointer**

In `skills/status/SKILL.md`, item 2 currently reads: "Check background tasks (executors still running) and active Batuta worktrees, if any." Append to the same item:

```markdown
   With the Compozy runtime active, also list the project's `batuta/*`
   sessions (`compozy.md`, status row).
```

- [ ] **Step 2b: Add the pause pointer**

In `skills/pause/SKILL.md`, item 2 currently reads: "**Background tasks:** list what is still running; note in `WORK.md` what will finish on its own, stop what would be orphaned." Append to the same item:

```markdown
   With the Compozy runtime active, Compozy sessions are not orphans —
   record their ids in the handoff's Background section (`compozy.md`,
   parallelism row) instead of stopping them.
```

- [ ] **Step 3: Update PRD §5.1 and §9**

In `docs/PRD.md`:

- §5.1 tree, after the `codex-plugin.md` line, add (aligning the `#` comment with the neighboring lines' comment column):
  ```
  ├── compozy.md             # integração com o CompozyOS: delegação como sessão gerenciada
  ```
- §9, append the row:

```markdown
| Integração Compozy runtime | `compozy.md` dormante na raiz (padrão superpowers/codex-plugin); dois gatilhos: `COMPOZY_SESSION_ID` no ambiente = automático com precedência (maestro rodando via Compozy sempre despacha por ele), senão linha `Runtime: compozy` no perfil oferecida pelo init; delegação como sessão gerenciada com provider nativo (claude/codex/opencode) e flags da tabela mapeados 1:1 (`--provider/--model/--reasoning-effort`), sessões nomeadas `batuta/<slug>`; lotes em ondas de ≤ 5 filhas; relato via `session history`; fallback para subprocess com aviso | Host de sessões duráveis dá transcript por executor, paralelismo que sobrevive ao terminal e policy por workspace sem mudar uma vírgula do ciclo; automático dentro do daemon porque lançar o Batuta via Compozy já é a escolha do usuário e subprocess dali esconderia os instrumentistas; `WORK.md` + `.batuta/runs/` seguem fonte de verdade (estado não refém do host); destilação do CompozyOS verificada contra a CLI local — spec em `docs/superpowers/specs/` |
```

- [ ] **Step 4: Verify**

Run: `grep -n "compozy\|Runtime" skills/init/SKILL.md skills/status/SKILL.md` — expected: one bullet in init, one sentence in status.
Run: `grep -n "compozy.md" docs/PRD.md` — expected: §5.1 tree line; §9 row present and single-line.

- [ ] **Step 5: Commit**

```bash
git add skills/init/SKILL.md skills/status/SKILL.md docs/PRD.md
git commit -m "feat: runtime compozy no init, status e pause — oferta, listagem e handoff de sessões"
```

(Body: one sentence per skill touched + PRD records; reference the spec file; end with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.)

---

## Acceptance check (after both tasks)

Against the spec's aceite:

- Sem `Runtime:` e fora de sessão gerenciada → nada muda (pointers are conditional; `compozy.md` is dormant).
- `COMPOZY_SESSION_ID` presente → delegação via Compozy mesmo sem linha (Activation §1 + Step 3 pointer).
- Delegação carrega comando/flags da tabela (delegation row, native provider mapping).
- Lote paralelo com pause/resume por ids de sessão (parallelism row).
- Daemon indisponível → fallback barulhento (Activation, last paragraph).
- Peso: skills cresceram ≤ 1 sentença condicional cada; todo detalhe no `compozy.md`.
