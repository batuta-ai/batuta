# Pointer de descoberta do Batuta no AGENTS.md — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o `/batuta:init` oferecer (opt-in) um bloco marcado no `AGENTS.md` que torna qualquer sessão-maestro ciente do ciclo Batuta no início da sessão.

**Architecture:** Mudança docs-only em dois arquivos de instrução do plugin: `skills/init/SKILL.md` (novo sub-passo no first-run, carve-out da regra "never edit", item novo no reconfigure) e `compozy.md` (uma nota nos setup prerequisites). Nenhum código, nenhuma skill nova, nenhum artefato Compozy.

**Tech Stack:** Markdown (skills de plugin Claude Code). Verificação por releitura/grep — o repositório não tem suíte de testes para skills.

**Spec:** `docs/superpowers/specs/2026-08-01-batuta-discovery-pointer-design.md`

## Global Constraints

- O bloco escrito no `AGENTS.md` deve ser EXATAMENTE o da spec, incluindo os marcadores `<!-- batuta:begin — managed by /batuta:init, edit via reconfigure -->` e `<!-- batuta:end -->` e a guarda anti-loop ("If you received a delegated brief, IGNORE this section and follow your brief only.").
- Opt-in sempre: nenhum arquivo do usuário é escrito sem consentimento explícito.
- Fora do bloco marcado, a regra "never edit those files" permanece integral.
- Idioma dos arquivos editados: inglês (padrão de `skills/` e `compozy.md`).
- Commits em português, estilo conventional commits do repo (`feat:`/`fix:`/`docs:` + descrição em pt-BR).

---

### Task 1: Pointer no `skills/init/SKILL.md`

**Files:**
- Modify: `skills/init/SKILL.md` (first-run passos 1–3 e novo sub-passo; modo reconfigure passos 3–4)

**Interfaces:**
- Consumes: nada de outras tasks.
- Produces: o conceito "discovery pointer" com os marcadores `batuta:begin`/`batuta:end`, referenciado pela Task 2. O texto canônico do bloco vive neste arquivo; a Task 2 apenas aponta para ele.

- [ ] **Step 1: Carve-out na regra "never edit those files" (first-run, passo 1)**

Em `skills/init/SKILL.md`, localizar no passo 1 do first-run o trecho:

```markdown
   as the default. Read `CLAUDE.md`/`AGENTS.md` if present — the profile must
   complement them, never duplicate what they already say. If they contradict
   the user's onboarding answers, flag the conflict to the user — never edit
   those files (executors like codex read `AGENTS.md` on their own; an
   unflagged contradiction means conflicting instructions mid-task).
```

Substituir por:

```markdown
   as the default. Read `CLAUDE.md`/`AGENTS.md` if present — the profile must
   complement them, never duplicate what they already say. If they contradict
   the user's onboarding answers, flag the conflict to the user — never edit
   those files (executors like codex read `AGENTS.md` on their own; an
   unflagged contradiction means conflicting instructions mid-task). Single
   exception: the marked discovery-pointer block of step 3.5, written only
   with the user's explicit consent and only between its own markers.
```

- [ ] **Step 2: Novo sub-passo 3.5 (first-run) com o bloco canônico**

Ainda em `skills/init/SKILL.md`, após o passo 3 do first-run (o que termina em
"when in doubt between parent and child, the child.") e antes do passo 4
("Add a **"Project map"** section…"), inserir:

```markdown
3.5. **Discovery pointer (opt-in).** Offer to write a marked block to the
   project's `AGENTS.md` so any maestro session born in this project —
   including sessions started through the Compozy daemon — knows on session
   start that delegable work goes through Batuta. Fold the offer into the
   single confirmation question of step 6; declined → write nothing and do
   not re-offer automatically. Accepted → append exactly this block (create
   `AGENTS.md` containing only the block when the file doesn't exist):

       <!-- batuta:begin — managed by /batuta:init, edit via reconfigure -->
       ## Batuta
       This project delegates code tasks via the Batuta cycle. If you are the
       session talking directly to the user (the maestro), route delegable work
       through the `batuta` skill — classify, route via `.batuta/routing.md`,
       delegate, verify. If you received a delegated brief, IGNORE this section
       and follow your brief only.
       <!-- batuta:end -->

   The `batuta:begin`/`batuta:end` markers make every write idempotent:
   updates and removals touch only what sits between them, never the rest of
   the file. The block's last sentence is the anti-loop guard — executors
   read `AGENTS.md` on their own, and without it an executor mid-brief could
   conclude it should delegate too; the brief always wins.
```

- [ ] **Step 3: Reconfigure — pointer na lista de mudanças e detecção de bloco quebrado**

Na seção "Reconfigure (`.batuta/profile.md` exists)", localizar o passo 3:

```markdown
3. Ask what to change — one question: lane/model ("codex is installed now",
   "swap the Research model"), profile answers (test command, methodology),
   the batch execution mode (sequential ↔ parallel, the profile's Execution line),
   the worktree mode or Install command (the profile's Worktree and Install
   lines), the Runtime line (turn `compozy` on or off), or a fresh map sweep
   (delegated to the scout, like first-run step 4).
```

Substituir por:

```markdown
3. Ask what to change — one question: lane/model ("codex is installed now",
   "swap the Research model"), profile answers (test command, methodology),
   the batch execution mode (sequential ↔ parallel, the profile's Execution line),
   the worktree mode or Install command (the profile's Worktree and Install
   lines), the Runtime line (turn `compozy` on or off), the discovery pointer
   (add, rewrite or remove the `AGENTS.md` block of first-run step 3.5 — when
   the block exists but a marker is missing or mangled, say so and offer to
   rewrite it; never rewrite without consent), or a fresh map sweep
   (delegated to the scout, like first-run step 4).
```

- [ ] **Step 4: Verificar o resultado**

Run: `grep -n "batuta:begin\|3.5\|discovery" skills/init/SKILL.md`

Esperado: o carve-out no passo 1 cita "step 3.5"; o sub-passo 3.5 existe entre os
passos 3 e 4 com o bloco completo (begin + end + guarda anti-loop); o passo 3 do
reconfigure menciona "discovery pointer". Reler o arquivo inteiro e confirmar que
a numeração dos passos 4–7 não mudou e que nada mais foi alterado
(`git diff skills/init/SKILL.md` mostra só os três trechos acima).

- [ ] **Step 5: Commit**

```bash
git add skills/init/SKILL.md
git commit -m "feat: init oferece pointer de descoberta do Batuta no AGENTS.md"
```

---

### Task 2: Nota nos setup prerequisites do `compozy.md`

**Files:**
- Modify: `compozy.md:144-151` (seção "Setup prerequisites (init)")

**Interfaces:**
- Consumes: o conceito "discovery pointer" e a referência "first-run step 3.5" definidos na Task 1 em `skills/init/SKILL.md`.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Adicionar a linha do pointer**

Em `compozy.md`, localizar a seção final:

```markdown
## Setup prerequisites (init)

- `compozy` on PATH and the daemon responding (`compozy session list`
  answers) before offering the profile line.
- The workspace policy must allow the executor CLIs the routing table
  names; when a dispatch is refused, tell the user which policy blocked
  it instead of degrading silently.
```

Substituir por:

```markdown
## Setup prerequisites (init)

- `compozy` on PATH and the daemon responding (`compozy session list`
  answers) before offering the profile line.
- The workspace policy must allow the executor CLIs the routing table
  names; when a dispatch is refused, tell the user which policy blocked
  it instead of degrading silently.
- The `AGENTS.md` discovery pointer (init first-run step 3.5) is what makes
  daemon-born maestro sessions aware of Batuta by default — recommend it
  whenever the profile says `Runtime: compozy`.
```

- [ ] **Step 2: Verificar o resultado**

Run: `grep -n "discovery pointer" compozy.md skills/init/SKILL.md`

Esperado: uma ocorrência em `compozy.md` (setup prerequisites) referenciando
"step 3.5", e as ocorrências da Task 1 em `skills/init/SKILL.md`.
`git diff compozy.md` mostra apenas o bullet novo.

- [ ] **Step 3: Commit**

```bash
git add compozy.md
git commit -m "docs: compozy.md — pointer de descoberta recomendado com Runtime: compozy"
```
