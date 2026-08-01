# Tasks Compozy como ciclo de vida da delegação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `docs/superpowers/specs/2026-08-01-compozy-tasks-design.md`: mirror each `WORK.md` work item as a Compozy task and run each delegation as a task run, driven entirely by the maestro, so the daemon's kanban (`compozy open`) shows the plan with *verified* state — all as new sections in the existing dormant `compozy.md`, zero new lines in skills.

**Architecture:** Same dormant pattern as the runtime integration: every detail lives in `compozy.md` (a new "Task board row" section + map-table row + status-row sentence); `runs.md` gains one field (`Task:`) in the trail header; the PRD records the decision. Skills are untouched — they already point at `compozy.md`.

**Tech Stack:** Markdown only. Verification = grep/read checks. CLI facts verified against the locally installed `compozy` (2026-08-01, see "Residual resolved" below).

## Global Constraints

- Root references in **English**; PRD in **PT-BR** (PRD §9, Idiomas).
- Zero new lines in skills (spec aceite); all detail in `compozy.md`.
- Exact names: task identifier `batuta/<slug>` (same slug as the session name); trail field `**Task:**`.
- `WORK.md` + `.batuta/runs/` remain the only source of truth; sync is one-way (`WORK.md` → board); divergence resolves in `WORK.md`'s favor.
- Every task call is best-effort: daemon down or command refused → loud warning, cycle continues on `WORK.md` alone. The cycle never waits on the board.
- `complete` only after Step 4's verification approves — the board shows verified state, never self-reported state.
- The scout never becomes a task (same rule as sessions). Approvals (`task approve`/`reject`) stay out of scope.

## Residual resolved (CLI verification, 2026-08-01)

The spec left open whether run claiming works for a maestro outside the daemon. Verified against the installed CLI:

- `compozy me` outside a managed session → `identity_required` ("COMPOZY_SESSION_ID is required for agent commands"). Session-bound claiming (`task next`, `task heartbeat`) is unavailable to an unmanaged maestro, and would anyway bind the lease to the *maestro's* session — the wrong actor.
- The **operator path** exists and is identity-free: `compozy task run enqueue|start|complete|fail|cancel <run-id>` plus `compozy task run attach-session <run-id> --session <id>` (links the executor's session to the run). `compozy task fail` explicitly supports operator override (`--reason`).

Decision locked in this plan: **uniform operator path in both modes** (managed and unmanaged maestro), no lease/heartbeat — same board semantics, one code path. This is exactly the fallback the spec's residual clause anticipated.

---

### Task 1: Seção "Task board row" no `compozy.md` + campo Task na trilha

**Files:**
- Modify: `compozy.md` (map table ~line 47-52; new section after "Parallelism row"; "Status row" section)
- Modify: `runs.md` (Format header, line 24)

**Interfaces:**
- Produces: section named exactly "Task board row" in `compozy.md`; trail field `**Task:** <runtime task id, or —>` in `runs.md` (referenced by Task 2's PRD row).

- [ ] **Step 1: Add the board row to the map table in `compozy.md`**

In the "## Map — cycle moment → runtime behavior → what Batuta keeps" table, after the "Delegation (Step 3)" row, add:

```markdown
| Plan & lifecycle (Steps 1–5) | items mirrored as tasks, delegations as task runs (task board row) | `WORK.md` as the only source of truth; `complete` only after verification |
```

- [ ] **Step 2: Insert the "Task board row" section in `compozy.md`**

Insert between the "## Parallelism row" and "## Status row" sections:

```markdown
## Task board row

With the runtime active, the plan itself becomes visible on the daemon's
task board (`compozy open`): each `WORK.md` work item is mirrored as a
Compozy task and each delegation runs as a task run. The maestro drives
every transition — the executor never touches the board, and `complete`
happens only after Step 4's verification approves, so the board shows
*verified* state, never self-reported state.

**Mirror (Step 1/1.5):** when an item enters `WORK.md` —

    compozy task create --scope workspace \
      --identifier "batuta/<slug>" --title "<item title>" \
      --metadata '{"lane":"<lane>","executor":"<executor>"}' -o json

Same slug as the session name — task and session find each other by it.
Plan ordering maps to `compozy task dependency add`; parallel batch
items become child tasks of the batch item (`compozy task child`).

**Run lifecycle (Step 3→5):** the maestro uses the operator-level run
commands — session-bound claiming (`task next`, `heartbeat`) requires a
managed identity and would bind the lease to the *maestro's* session,
the wrong actor; the operator path works identically inside and outside
the daemon:

    compozy task run enqueue <task-id> -o json        # at dispatch
    compozy task run attach-session <run-id> --session "<session id>"
    compozy task run start <run-id>
    # after Step 4 approves:
    compozy task run complete <run-id> --result '{"verdict":"approved","commit":"<sha>"}'
    # retry exhausted / definitive failure:
    compozy task fail <run-id> --reason "<what failed>"
    compozy task retry <task-id>                      # new attempt, same task

Retries within the same session keep the same run alive — nothing to do
on the board. Escalation swaps the session (delegation row), never the
task: fail the run, `task retry`, attach the new session — attempt
history stays aggregated per work item.

**Blockers:** `compozy task block <task-id> --reason "<typed reason>"`
when an item blocks; `compozy task unblock <task-id>` when it clears.

**Rules:**

- **One-way sync** (`WORK.md` → board): `/batuta:resume` reconciles by
  creating whatever is missing on the board; board state never flows
  back into `WORK.md`. Divergence resolves in `WORK.md`'s favor — the
  board is a lens, not memory.
- **The scout never becomes a task** — same rule as sessions: research
  dispatches are not work items.
- **Best-effort, always:** daemon down or a task command refused → warn
  loudly and continue the cycle on `WORK.md` alone. The cycle never
  waits on, or fails for, the board.
- **The trail records the task id** next to the session id (`runs.md`).
- Confirm the exact JSON shape of `task create`/`task run enqueue` on
  first use, as with `session history`.
```

- [ ] **Step 3: Extend the "Status row" section in `compozy.md`**

The section currently ends: "`WORK.md` remains the source of truth; the daemon is a lens." Insert before that final sentence:

```markdown
With the task board in use, also list the project's `batuta/*` tasks
(`compozy task list --query batuta/ -o json`); `compozy open` shows the
same items as a kanban.
```

- [ ] **Step 4: Add the Task field to the trail header in `runs.md`**

In the "## Format" block, the header line currently reads:

```markdown
**Commit:** <sha or —> · **Verdict:** ✅ approved | ⏫ escalated from <lane> | ❌ aborted · **Session:** <runtime session id, or —>
```

Append ` · **Task:** <runtime task id, or —>` so it becomes:

```markdown
**Commit:** <sha or —> · **Verdict:** ✅ approved | ⏫ escalated from <lane> | ❌ aborted · **Session:** <runtime session id, or —> · **Task:** <runtime task id, or —>
```

- [ ] **Step 5: Verify**

Run: `grep -n "Task board row\|task run enqueue\|attach-session\|task retry\|task block\|One-way sync" compozy.md` — expected: section title, all five command anchors, and the sync rule present.
Run: `grep -c "Task board row" compozy.md` — expected: 2 (map-table reference + section title).
Run: `grep -n "Task:" runs.md` — expected: the extended header line with both Session and Task fields.
Run: `grep -rn "task board\|compozy task" skills/` — expected: no matches (zero new skill lines).

- [ ] **Step 6: Commit**

```bash
git add compozy.md runs.md
git commit -m "feat: task board Compozy — itens do WORK.md como tasks, delegação como task run"
```

(Body: two sentences — mirror + operator-path lifecycle driven by the maestro with complete only after verification; reference the spec file; end with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.)

---

### Task 2: Registro no PRD

**Files:**
- Modify: `docs/PRD.md` (§9 decisions table)

**Interfaces:**
- Consumes: section name "Task board row" and trail field `Task:` from Task 1.

- [ ] **Step 1: Append the §9 row**

In `docs/PRD.md` §9, after the "Integração Compozy runtime" row, append:

```markdown
| Task board Compozy | Seções novas no `compozy.md` dormante (mesmos gatilhos do runtime, sem linha nova de perfil): cada item do `WORK.md` vira task Compozy (`--identifier batuta/<slug>`, mesmo slug da sessão; dependências e child tasks seguem o plano) e cada delegação vira task run pelo caminho de operador (`task run enqueue/attach-session/start/complete/fail` + `task retry`), uniforme dentro e fora do daemon — claim session-bound (`task next`/`heartbeat`) descartado, verificado na CLI: exige identidade gerenciada e amarraria o lease à sessão do maestro; `complete` só após a verificação do Step 4; bloqueios como `task block` tipado; trilha grava o id da task; sync unidirecional `WORK.md` → board, best-effort com aviso | Kanban do daemon (`compozy open`) passa a mostrar o plano com estado **verificado**, não auto-relatado — o maestro dirige todas as transições e o executor nunca toca o board; `WORK.md` segue única fonte de verdade (board é lente, divergência resolve a favor do texto); aprovações, canais, Memory e automation ficam para specs próprias; spec em `docs/superpowers/specs/2026-08-01-compozy-tasks-design.md` |
```

- [ ] **Step 2: Verify**

Run: `grep -n "Task board Compozy" docs/PRD.md` — expected: one §9 row, single line.
Run: `grep -c "compozy" docs/PRD.md` — expected: count grew vs. `git show HEAD -- docs/PRD.md` (row added, nothing removed).

- [ ] **Step 3: Commit**

```bash
git add docs/PRD.md
git commit -m "docs: PRD §9 — decisão do task board Compozy"
```

(Body: one sentence; reference the spec file; end with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.)

---

## Acceptance check (after both tasks)

Against the spec's aceite:

- Sem runtime ativo → byte-idêntico: `compozy.md` é dormante e as skills não ganharam linha alguma (`grep -rn "task board" skills/` vazio).
- Com runtime ativo → cada transição da tabela da spec tem comando nomeado na "Task board row"; `complete` documentado como pós-verificação.
- Retry esgotado → `task fail` + `task retry` na mesma task (histórico agregado).
- Bloqueio → `task block --reason` tipado; `unblock` ao resolver.
- `/batuta:resume` → regra de reconciliação unidirecional na seção (cria o que falta; nunca lê o board de volta).
- Daemon caindo → regra best-effort com aviso, o ciclo nunca espera o board.
- Peso: zero linhas novas nas skills; trilha ganhou um campo; PRD uma linha.
