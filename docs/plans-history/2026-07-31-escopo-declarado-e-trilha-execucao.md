# Escopo declarado + trilha de execução — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the two proposals of `docs/superpowers/specs/2026-07-31-trilha-execucao-e-escopo-declarado-design.md`: the Scope field + mechanical scope check (Proposal 2), then the run trail `.batuta/runs/` (Proposal 1).

**Architecture:** Pure-markdown plugin — each proposal edits `skills/batuta/SKILL.md` within its line budget, moves detail to a dormant root reference when needed (`runs.md`, mirroring `verification.md`), and records the decision in `docs/PRD.md`. One atomic commit per proposal, spec order: Scope first (produces the field the trail records).

**Tech Stack:** Markdown only. No test suite — verification is grep/wc checks against the spec's acceptance criteria and line budgets.

## Global Constraints

- Skills/adapters/templates/root references in **English**; PRD in **PT-BR** (PRD §9, Idiomas).
- Proposal 2 budget: `skills/batuta/SKILL.md` grows ≤ ~10 lines total across Step 2 + Step 4.
- Proposal 1 budget: Step 5 grows ≤ ~15 lines; trail format lives in a dormant root reference.
- The cycle's authority rules are untouched: no new command, no routing change, no commit-format change.
- Write boundary: plugin files + `docs/PRD.md` only (the trail itself is created at runtime in user projects, not in this repo).

---

### Task 1: Escopo declarado — Scope field (Step 2) + scope check (Step 4) + PRD

**Files:**
- Modify: `skills/batuta/SKILL.md` (Step 2 bullet list; Step 4 numbered list)
- Modify: `docs/PRD.md` (§6.3 items 1 and 3; §9 decisions table)

**Interfaces:**
- Produces: a brief field named exactly **Scope** (referenced verbatim by Task 2's trail format) and a Step 4 check named **Scope check**.

- [ ] **Step 1: Add the Scope bullet to Step 2**

In `skills/batuta/SKILL.md`, immediately after the line `- **Boundaries** — what NOT to touch.`, insert:

```markdown
- **Scope** — the closed list of paths the task may change (files when
  known; a directory or glob when discovery is part of the task). Test
  paths and legitimately touched generated files (locks, snapshots) enter
  the list explicitly — no implicit exemptions. Close with: *do not change
  anything outside this list; if the task requires it, stop and report.*
  No closable list → `Unknown — <reason>` plus the narrowest bound the
  task admits (the module, the directory).
```

- [ ] **Step 2: Add the Scope check to Step 4 and renumber**

In `skills/batuta/SKILL.md`, Step 4, under `Always, no exceptions:`, insert as the new item 1 (before Diff review):

```markdown
1. **Scope check** — `git diff --name-only` (in a worktree, `git diff
   --name-only main...batuta/<slug>`) against the brief's Scope list. A
   path outside the list fails verification even when the code is correct
   — name the files in the feedback. Widening the Scope is the maestro's
   decision at re-brief, never the executor's.
```

Then renumber the existing items: `1. **Diff review**` → `2.`, `2. **Tests**` → `3.`, `3. **Acceptance criteria**` → `4.`.

- [ ] **Step 3: Verify budget and consistency**

Run: `git diff --stat skills/batuta/SKILL.md` — expected: ≤ ~13 insertions (7 + 6, within "~10" tolerance of the spec's aceite; if materially above, trim prose).
Run: `grep -n "Scope" skills/batuta/SKILL.md` — expected: the Step 2 bullet, the Step 4 check, and no stale numbering (`grep -n "^[0-9]\." skills/batuta/SKILL.md` shows 1–4 in Step 4).

- [ ] **Step 4: Update PRD §6.3**

In `docs/PRD.md` §6.3, edit item 1 and item 3 of the cycle list:

- Item 1, replace `objetivo, contexto, arquivos relevantes, convenções do perfil/template, critérios de aceite.` with `objetivo, contexto, arquivos relevantes, convenções do perfil/template, critérios de aceite, escopo (lista fechada de caminhos alteráveis).`
- Item 3, replace `**Verificar** — \`git diff\` review pelo orquestrador + testes do projeto +` with `**Verificar** — checagem de escopo (\`git diff --name-only\` contra a lista do brief) + \`git diff\` review pelo orquestrador + testes do projeto +`

- [ ] **Step 5: Add the decision row to PRD §9**

Append to the table in `docs/PRD.md` §9:

```markdown
| Escopo declarado no brief | Campo Scope (lista fechada de caminhos alteráveis) pareado com o Boundaries negativo; checagem mecânica `git diff --name-only` contra a lista como primeiro passo do Step 4 — caminho fora da lista reprova mesmo com código correto; ampliar a lista é decisão do maestro no re-brief, nunca do executor | Boundaries diz o que evitar, não delimita onde trabalhar — executor sem alcance declarado inventa o próprio; a checagem de caminhos é a mais barata das verificações e pega extravasamento antes do review de conteúdo; candidata a causa dos commits atômicos falhos observados em uso real; destilado das policy-filtered tools do CompozyOS — spec em `docs/superpowers/specs/` |
```

- [ ] **Step 6: Commit**

```bash
git add skills/batuta/SKILL.md docs/PRD.md
git commit -m "feat: escopo declarado no brief — campo Scope no Step 2 e checagem mecânica no Step 4"
```

(Body: summary of the field + check, reference to the spec file, Co-Authored-By line per session convention.)

---

### Task 2: Trilha de execução — `runs.md` dormante + Step 5 + cross-review + PRD

**Files:**
- Create: `runs.md` (plugin root, sibling of `verification.md`)
- Modify: `skills/batuta/SKILL.md` (Step 5 numbered list)
- Modify: `verification.md` (cross-review contract, "The maestro judges" bullet)
- Modify: `docs/PRD.md` (§5.1 tree; §5.2 tree; §6.3 item 5; §9 decisions table)

**Interfaces:**
- Consumes: the **Scope** field name from Task 1 (recorded in the trail's Brief verbatim — no extra handling needed).
- Produces: root reference file named exactly `runs.md`; trail path convention `.batuta/runs/<YYYY-MM-DD>-<slug>.md`.

- [ ] **Step 1: Create `runs.md` at the plugin root**

```markdown
# Run trail — evidence that survives the session

How the maestro records each cycle in `.batuta/runs/`. Dormant like the
adapters: Step 5 points here in one line; read this file only when
writing a trail.

## When and where

One trail per task, written at Step 5 alongside the commit — the trail
follows the atomic-commit unit: a decomposed batch of six items leaves
six trails. An item that fails definitively (even after escalation) also
leaves one, verdict `❌ aborted`, written when the failure is declared —
that is where the evidence matters most.

Path: `.batuta/runs/<YYYY-MM-DD>-<slug>.md`. Ensure `.batuta/runs/` is
listed in `.git/info/exclude` (never `.gitignore` — that file is the
user's). Trail content follows the user's language, like `WORK.md`.

## Format

    # Run — <task title>

    **Date:** <date> · **Lane:** <lane> · **Executor:** <executor + model>
    **Commit:** <sha or —> · **Verdict:** ✅ approved | ⏫ escalated from <lane> | ❌ aborted

    ## Brief
    <the brief sent to the executor, verbatim>

    ## Executor report
    <the executor's relevant output, verbatim — not summarized>

    ## Verification
    - Criterion 1 — proof re-run: `<command>` → <observed result>
    - Test-hygiene scans: <n/a | clean | finding at file:line>
    - Cross-review: <n/a | accepted/declined findings, one line each>

    ## Retries and escalation
    <empty when it passed first try; otherwise what failed and what
    changed in the re-brief>

## Rules

- **Verbatim where it matters.** Brief and executor report enter without
  summarizing — summarizing is losing the evidence. The Verification
  section is the maestro's and stays short: command + observed result,
  never narrative.
- **`WORK.md` points, never inflates.** The task's line gains at most
  the trail file reference.
- **Cross-review findings land here.** After the maestro's judgment
  (`verification.md`, cross-review contract), accepted and declined
  findings are copied one line each into Verification; the external
  findings file remains disposable.
- **Not memory.** The maestro does not read `.batuta/runs/` during the
  cycle; only the retro, `/batuta:review` on demand, and the human do.
- **No retention machinery.** No rotation, TTL or compaction — text
  files the user deletes if they ever bother.
```

- [ ] **Step 2: Add the trail step to Step 5**

In `skills/batuta/SKILL.md`, Step 5, insert a new item 3 after item 2 (the `WORK.md` item), before the example block's closing prose:

```markdown
3. Run trail: write `.batuta/runs/<date>-<slug>.md` per `runs.md` (plugin
   root) — brief and executor report verbatim, proofs re-run, verdict.
   One trail per task; an item that fails definitively also gets one
   (verdict aborted), written when the failure is declared. Append the
   trail reference to the task's `WORK.md` line.
```

- [ ] **Step 3: Point cross-review findings at the trail**

In `verification.md`, "The maestro judges" bullet, after `The verdict is always the maestro's.`, append in the same bullet:

```markdown
Accepted and declined findings are then recorded one line each in the
  task's run trail (`runs.md`).
```

- [ ] **Step 4: Verify budget and structure**

Run: `git diff --stat skills/batuta/SKILL.md` — expected: ≤ ~6 insertions for this task (cumulative with Task 1 stays under both budgets).
Run: `grep -n "runs.md\|\.batuta/runs/" skills/batuta/SKILL.md verification.md runs.md` — expected: Step 5 points to `runs.md`; `verification.md` points to the trail; `runs.md` self-consistent (path convention appears once in "When and where").

- [ ] **Step 5: Update PRD (§5.1, §5.2, §6.3, §9)**

In `docs/PRD.md`:

- §5.1 tree, after the `verification.md` line, add:
  ```
  ├── runs.md                # trilha de execução: formato e regras do .batuta/runs/
  ```
- §5.2 tree, after the `worktrees/<slug>/` line, add (adjusting the last `└──` connector):
  ```
  └── runs/<data>-<slug>.md  # trilha por tarefa: brief, relato, provas, veredito (ignorada via .git/info/exclude)
  ```
- §6.3 item 5, replace `**Registrar** — uma linha no \`WORK.md\`.` with `**Registrar** — uma linha no \`WORK.md\` + trilha da tarefa em \`.batuta/runs/\`.`
- §9, append the row:

```markdown
| Trilha de execução | `.batuta/runs/<data>-<slug>.md` por tarefa verificada (e por abortada): brief verbatim, relato do executor verbatim, provas reproduzidas e veredito; escrita no Step 5; `WORK.md` só aponta; local via `.git/info/exclude`; formato e regras no `runs.md` dormante da raiz; findings de cross-review julgados são registrados nela | "Declared ≠ verified" exige evidência, mas ela evaporava com a sessão — o retrô julgava por memória e sintomas como commits atômicos falhos ficavam sem material de diagnóstico; verbatim porque resumir é perder a evidência; não é memória (o maestro não a lê no ciclo); destilado do transcript por sessão do CompozyOS — spec em `docs/superpowers/specs/` |
```

- [ ] **Step 6: Commit**

```bash
git add runs.md skills/batuta/SKILL.md verification.md docs/PRD.md
git commit -m "feat: trilha de execução — .batuta/runs/ por tarefa com runs.md dormante"
```

(Body: what the trail records and why, reference to the spec file, Co-Authored-By line per session convention.)

---

## Acceptance check (after both tasks)

Against the spec's aceite sections:

- Every code brief carries Scope or motivated `Unknown` → Step 2 bullet present, phrased as mandatory like every brief field.
- Out-of-scope path fails verification with files named → Step 4 item 1.
- Executor stopping at the scope limit is a legitimate stop → covered by the existing Stop conditions + the Scope bullet's closing sentence.
- One trail per verified task, aborted items included → Step 5 item 3 + `runs.md` "When and where".
- Trail answers brief/report/proof/verdict without the original session → `runs.md` Format.
- `WORK.md` grows only by the reference → Step 5 item 3 last sentence + `runs.md` rule.
- Budgets: Step 2+4 ≤ ~10 lines; Step 5 ≤ ~15 lines with format in dormant reference.
