# Comandos init/pause/resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revisar a superfície de comandos do Batuta: onboarding/reconfiguração viram `/batuta:init`, pausa/retomada viram `/batuta:pause` e `/batuta:resume`, o `/batuta` emagrece para só o ciclo, e os skills existentes são renomeados para os nomes documentados.

**Architecture:** Repo 100% markdown (plugin Claude Code; comando = skill, prefixo de plugin opcional sem conflito). Três skills novos (`skills/init|pause|resume/SKILL.md`), cirurgia no `skills/batuta/SKILL.md` (Step 0 → gates), `git mv` dos 4 skills prefixados, e atualização de referências em routing.md, README e PRD. Spec aprovado: `docs/superpowers/specs/2026-07-20-comandos-init-pause-resume-design.md`.

**Tech Stack:** Markdown; verificação por `grep`; commits conventional em PT-BR direto na main.

## Global Constraints

- Idiomas (PRD §9): `skills/*`, `routing.md` em **inglês**; `README.md` e `docs/PRD.md` em **PT-BR**.
- Superfície final: `/batuta` + `/batuta:init|plan|pause|resume|status|route|review` — 8 comandos; o principal é documentado como `/batuta` (nunca `/batuta:batuta`).
- `/batuta` nunca faz onboarding inline (aponta pro init e para) e nunca auto-resume (gate avisa em 1 linha e obedece a escolha).
- Handoff (`.batuta/handoff.md`) é nota transitória: um por projeto, sobrescrito no pause, absorvido no `WORK.md` e **apagado** no resume.
- Reconfiguração nunca toca `WORK.md`; princípio do adapter dormente preservado (checar só o que a tabela referencia).
- Sem aliases/migração para nomes antigos de comando; sem mudanças de conteúdo em plan/status/route/review além de dir + `name:`.

---

### Task 1: Criar `skills/init/SKILL.md`

**Files:**
- Create: `skills/init/SKILL.md`

**Interfaces:**
- Consumes: conteúdo do Step 0 atual de `skills/batuta/SKILL.md` (movido; a REMOÇÃO de lá é a Task 2).
- Produces: skill `init` com modos first-run e reconfigure — referenciado pelas Tasks 2 (gate), 5 (routing/README) e 6 (PRD) como `skills/init/SKILL.md`.

- [ ] **Step 1: Criar o arquivo com o conteúdo completo**

O conteúdo first-run é o Step 0 atual do skill principal, movido com três adaptações: numeração interna vira "step N below", a linha final "Onboarding never repeats" sai (substituída pelo modo reconfigure), e a referência ao formato do WORK.md aponta para o skill principal. Conteúdo integral:

````markdown
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
   or a fresh map sweep (delegated to the scout, like first-run step 4).
4. Rewrite only what changed (`.batuta/routing.md` and/or
   `.batuta/profile.md`), reusing first-run step 6's discovery and single
   confirmation question for any lane/model change. Never touch `WORK.md`.
````

- [ ] **Step 2: Verificar**

Run: `grep -n "name: init" skills/init/SKILL.md && grep -c "Reconfigure" skills/init/SKILL.md`
Expected: frontmatter na linha 2; contagem ≥ 2.

- [ ] **Step 3: Commit**

```bash
git add skills/init/SKILL.md
git commit -m "feat: skill init — onboarding movido e modo reconfiguração"
```

---

### Task 2: Emagrecer `skills/batuta/SKILL.md` (Step 0 → gates)

**Files:**
- Modify: `skills/batuta/SKILL.md`

**Interfaces:**
- Consumes: skill `init` (Task 1) — o gate aponta para ele.
- Produces: `/batuta` só-ciclo com gates; referência do batedor a `skills/init/SKILL.md` (consumida pela Task 5 em routing.md).

- [ ] **Step 1: Atualizar a description do frontmatter**

Substituir a description atual (linha 3) por:

```yaml
description: Batuta's main entry point — the conducting cycle. Use when the user requests a code task that can be delegated (feature, bugfix, refactor, config), asks where or how something lives in the codebase (research — see "The scout"), or invokes /batuta. Classifies complexity, routes to the cheapest capable executor, builds the brief, delegates, verifies and commits. Setup lives in /batuta:init.
```

- [ ] **Step 2: Substituir o Step 0 inteiro pelos gates**

Remover da linha `## Step 0 — Onboarding (first run only)` até a linha `Onboarding never repeats. The user can edit the profile at any time.` (inclusive — é o bloco todo que a Task 1 moveu) e colocar no lugar:

```markdown
## Step 0 — Gates

Two one-line checks before anything else:

1. **No `.batuta/profile.md`** → the project is not set up: tell the user to
   run `/batuta:init` and stop. Never run onboarding inline.
2. **`.batuta/handoff.md` exists** → there is paused work: say so in one line
   ("paused work from <date> — `/batuta:resume` to pick it up, or I continue
   with the new request") and obey the user's choice. Never auto-resume.
```

- [ ] **Step 3: Atualizar a referência do batedor ao onboarding**

Na seção `## The scout — research delegation`, trocar:

"Three triggers: the
onboarding map sweep (Step 0.4), brief context (Step 2), and ad-hoc user
questions about the codebase"

por:

"Three triggers: the
onboarding map sweep (`skills/init/SKILL.md`), brief context (Step 2), and
ad-hoc user questions about the codebase"

- [ ] **Step 4: Verificar**

Run: `grep -n "Gates\|/batuta:init\|/batuta:resume" skills/batuta/SKILL.md && grep -c "Step 0.4\|Step 0.6" skills/batuta/SKILL.md`
Expected: gates presentes com os dois comandos; contagem `Step 0.4|0.6` = 0 (nenhuma referência órfã).

- [ ] **Step 5: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "refactor: /batuta emagrece — Step 0 vira gates de init e resume"
```

---

### Task 3: Criar `skills/pause/SKILL.md` e `skills/resume/SKILL.md`

**Files:**
- Create: `skills/pause/SKILL.md`
- Create: `skills/resume/SKILL.md`

**Interfaces:**
- Consumes: nada de tasks anteriores (o contrato do handoff nasce aqui).
- Produces: contrato do `.batuta/handoff.md` (4 seções: Cycle point, Decisions not yet written, Background, Open questions) — citado pelas Tasks 5 (README) e 6 (PRD).

- [ ] **Step 1: Criar `skills/pause/SKILL.md`**

````markdown
---
name: pause
description: Pause Batuta work across sessions. Use when the user invokes /batuta:pause or says they are stopping and want to hand the current state off to a future session.
---

# Batuta pause — session handoff

1. **Honest `WORK.md`:** update the in-flight task's line with its real state
   ("delegated to codex, awaiting verification") — the conducting log stays
   truthful.
2. **Background tasks:** list what is still running; note in `WORK.md` what
   will finish on its own, stop what would be orphaned.
3. **Write `.batuta/handoff.md`** — prose, four fixed sections:

```markdown
# Handoff — <date>

## Cycle point
Where exactly the session stopped ("brief ready, delegation not sent").

## Decisions not yet written
Agreed in conversation but not yet in code or profile.

## Background
Executors running or pending, and what to do with each.

## Open questions
Pending questions for the user.
```

The handoff is a transit note, not state: `/batuta:resume` absorbs it into
`WORK.md` and deletes it. One handoff per project — pausing again overwrites
it.
````

- [ ] **Step 2: Criar `skills/resume/SKILL.md`**

```markdown
---
name: resume
description: Resume paused Batuta work. Use when the user invokes /batuta:resume or asks to pick up where a previous session left off.
---

# Batuta resume — pick up where the project left off

1. **Read the state:** `.batuta/profile.md`, `.batuta/routing.md`, `WORK.md`
   and `.batuta/handoff.md` (if present).
2. **Check git:** current branch, dirty tree, recent commits — reality may
   have moved since the pause; when the tree and the handoff disagree, the
   tree wins.
3. **Summarize in a few lines** (in-flight task, cycle point, pending
   decisions and questions) and confirm with the user before acting.
4. **Resume the cycle at the exact point.** Whatever the handoff carried
   becomes `WORK.md` lines or immediate action; then delete
   `.batuta/handoff.md` — it is a transit note, consumed on arrival.
5. **No handoff?** Resume from `WORK.md` alone and say so explicitly.
```

- [ ] **Step 3: Verificar**

Run: `grep -n "name: pause" skills/pause/SKILL.md && grep -n "name: resume" skills/resume/SKILL.md && grep -c "handoff" skills/pause/SKILL.md skills/resume/SKILL.md`
Expected: frontmatters corretos; "handoff" presente nos dois.

- [ ] **Step 4: Commit**

```bash
git add skills/pause/SKILL.md skills/resume/SKILL.md
git commit -m "feat: skills pause e resume — handoff de sessão consumível"
```

---

### Task 4: Renomear os skills prefixados

**Files:**
- Rename: `skills/batuta-plan` → `skills/plan`; `skills/batuta-status` → `skills/status`; `skills/batuta-route` → `skills/route`; `skills/batuta-review` → `skills/review` (com edição do `name:` no frontmatter de cada `SKILL.md`)

**Interfaces:**
- Consumes: nada.
- Produces: superfície `/batuta:plan|status|route|review` real — assumida pelas Tasks 5 e 6.

- [ ] **Step 1: git mv + frontmatter**

```bash
cd /home/franciscpd/Projects/batuta
git mv skills/batuta-plan skills/plan
git mv skills/batuta-status skills/status
git mv skills/batuta-route skills/route
git mv skills/batuta-review skills/review
```

Em cada `skills/<nome>/SKILL.md`, trocar a linha do frontmatter: `name: batuta-plan` → `name: plan`, `name: batuta-status` → `name: status`, `name: batuta-route` → `name: route`, `name: batuta-review` → `name: review`. As descriptions já citam `/batuta:plan` etc. — não mudam.

- [ ] **Step 2: Verificar que não sobrou referência aos nomes antigos**

Run: `ls skills/ && grep -rn "batuta-plan\|batuta-status\|batuta-route\|batuta-review" --include="*.md" . | grep -v docs/superpowers`
Expected: dirs `batuta init pause plan resume review route status`; grep sem resultados (fora de specs/planos históricos).

- [ ] **Step 3: Commit**

```bash
git add -A skills/
git commit -m "refactor!: comandos renomeados — plan, status, route e review sem prefixo"
```

(O `!` marca breaking change para o release-please registrar no CHANGELOG.)

---

### Task 5: routing.md + README

**Files:**
- Modify: `routing.md` (referência de onboarding, linhas 7–11)
- Modify: `README.md` (tabela de comandos; seção de onboarding; parágrafo pause/resume na seção de estado)

**Interfaces:**
- Consumes: skills das Tasks 1–4 e contrato do handoff (Task 3).

- [ ] **Step 1: routing.md — referência ao init**

Trocar "(see
`skills/batuta/SKILL.md`, Step 0.6). The executor column" por "(see
`skills/init/SKILL.md`). The executor column".

- [ ] **Step 2: README — tabela de comandos**

Substituir a tabela inteira da seção `## Comandos` por:

```markdown
| Comando | O que faz |
|---|---|
| `/batuta` | Entrada principal: entende o pedido, classifica, roteia, delega e verifica. Projeto sem configuração → aponta pro `/batuta:init`; trabalho pausado → oferece o `/batuta:resume` |
| `/batuta:init` | Onboarding na primeira vez; reconfiguração depois (lanes, modelos, perfil, mapa) |
| `/batuta:plan` | Força um plano formal aprovável (para trabalhos longos, que atravessam sessões) |
| `/batuta:pause` | Pausa o trabalho: `WORK.md` honesto + handoff da sessão em `.batuta/handoff.md` |
| `/batuta:resume` | Retoma do ponto exato: lê estado + handoff, confirma com você e segue; o handoff é consumido |
| `/batuta:status` | Mostra o `WORK.md`, as tarefas em background e a leitura de roteamento (tarefas por lane, taxa de delegação e de escalada) |
| `/batuta:route` | Exibe e edita as tabelas de roteamento (lanes de execução e de apoio) |
| `/batuta:review` | Re-executa a verificação sobre qualquer diff, sob demanda |
```

(Nota: a linha do `route` ganha "tabelas… e de apoio" — fecha o follow-up menor do review do batedor.)

- [ ] **Step 3: README — seção de onboarding**

Na seção `## Onboarding: o Batuta conhece o seu projeto`, trocar o parágrafo de abertura "Na **primeira execução** em um projeto, o Batuta faz 3-5 perguntas rápidas:" por:

```markdown
O onboarding é o `/batuta:init`: na primeira vez em um projeto, ele faz 3-5 perguntas rápidas (chamou `/batuta` antes de configurar? Ele te aponta o init e para):
```

E, após o parágrafo que termina em "...se falta instalar algo.", adicionar:

```markdown
Instalou um executor novo depois? `/batuta:init` de novo entra em modo **reconfiguração**: re-checa os executores da tabela, mostra o mapeamento atual e muda só o que você pedir — sem refazer o onboarding e sem tocar o `WORK.md`.
```

- [ ] **Step 4: README — pause/resume na seção de estado**

Na seção `## Estado: um arquivo, zero cerimônia`, adicionar ao final:

```markdown
Entre sessões, `/batuta:pause` deixa o `WORK.md` honesto e escreve um handoff curto (`.batuta/handoff.md`) com o ponto exato do ciclo, as decisões que ainda não viraram código e o estado dos executores em background. `/batuta:resume` lê tudo, confere o git, confirma com você e retoma — consumindo o handoff, que é nota de passagem, não estado.
```

- [ ] **Step 5: Verificar**

Run: `grep -n "skills/init" routing.md && grep -c "batuta:init\|batuta:pause\|batuta:resume" README.md`
Expected: routing aponta pro init; contagem ≥ 5 no README.

- [ ] **Step 6: Commit**

```bash
git add routing.md README.md
git commit -m "docs: superfície de 8 comandos no README e referência do routing ao init"
```

---

### Task 6: PRD

**Files:**
- Modify: `docs/PRD.md` (§6.1 título/abertura/fechamento; §6.7 tabela; nova §6.10; linha no §9)

**Interfaces:**
- Consumes: tudo anterior.

- [ ] **Step 1: §6.1 — título e abertura**

Trocar o título `### 6.1 Onboarding de projeto (primeira execução)` por `### 6.1 Onboarding e reconfiguração (/batuta:init)`.

Trocar a abertura "Na primeira invocação de `/batuta` em um projeto sem `.batuta/profile.md`, o
orquestrador conduz um onboarding curto (3–5 perguntas):" por:

```markdown
O onboarding é o modo primeira-execução do `/batuta:init` (3–5 perguntas).
`/batuta` num projeto sem `.batuta/profile.md` aponta para o init e para — o
ciclo nunca faz onboarding inline:
```

Trocar "O usuário pode editar
o perfil a qualquer momento; o onboarding não se repete." por:

```markdown
O usuário pode editar
o perfil a qualquer momento; `/batuta:init` num projeto já configurado entra
em modo **reconfiguração** — re-checa os executores referenciados pela tabela,
mostra o mapeamento e o perfil atuais e reescreve só o que o usuário pedir
(lane/modelo, respostas do perfil, re-sweep do mapa), sem tocar o `WORK.md`.
```

- [ ] **Step 2: §6.7 — tabela de comandos**

Substituir a tabela inteira por:

```markdown
| Comando | Função |
|---|---|
| `/batuta` | Entrada principal: o ciclo (classifica, roteia, delega, verifica). Gates: sem perfil → aponta pro init; handoff pendente → oferece o resume |
| `/batuta:init` | Onboarding (1ª vez) e reconfiguração (depois) |
| `/batuta:plan` | Força planejamento formal aprovável |
| `/batuta:pause` | Pausa: `WORK.md` honesto + handoff de sessão |
| `/batuta:resume` | Retoma do ponto exato e consome o handoff |
| `/batuta:status` | Mostra `WORK.md` e tarefas em background |
| `/batuta:route` | Exibe/edita as tabelas de roteamento |
| `/batuta:review` | Re-executa a verificação (passo 3) sobre qualquer diff |
```

- [ ] **Step 3: Nova §6.10 após a §6.9**

```markdown
### 6.10 Pausa e retomada (`/batuta:pause` / `/batuta:resume`)

O `WORK.md` diz *o quê* estava em andamento; o handoff diz *onde no ciclo* a
sessão parou. `/batuta:pause` atualiza o `WORK.md` com estado honesto, trata
as background tasks e escreve `.batuta/handoff.md` em prosa com 4 seções:
ponto do ciclo, decisões ainda não escritas, background e pendências com o
usuário. `/batuta:resume` lê perfil + routing + `WORK.md` + handoff, confere
o git (a árvore vence o handoff em divergência), resume a situação, confirma
e retoma — absorvendo o handoff no `WORK.md` e **apagando-o**: é nota de
passagem, não estado. Um handoff por projeto; pausar de novo sobrescreve.
`/batuta` com handoff pendente avisa em uma linha e obedece a escolha do
usuário — nunca auto-resume.
```

- [ ] **Step 4: §9 — linha de decisão**

Adicionar após a linha "| Batedor (lane de pesquisa) |...":

```markdown
| Superfície de comandos revista | 8 comandos: `/batuta` (só o ciclo, com gates) + init (onboarding/reconfiguração como único caminho), pause/resume (handoff transitório) e renames plan/status/route/review sem prefixo | O skill principal acumulava setup + ciclo e não havia como reconfigurar nem pausar; comando real (`plugin:skill`) divergia do documentado. Revisa a decisão "Comandos: 5". Breaking rename aceito em 0.x com um usuário; CHANGELOG avisa |
```

- [ ] **Step 5: Verificar**

Run: `grep -n "6.10\|batuta:init\|batuta:pause\|batuta:resume" docs/PRD.md | head -12`
Expected: §6.1 e §6.7 atualizados, §6.10 presente, linha no §9.

- [ ] **Step 6: Commit e push**

```bash
git add docs/PRD.md
git commit -m "docs: PRD — comandos init/pause/resume, reconfiguração e decisão registrada"
git push origin main
```

---

## Verificação final do plano (após Task 6)

- [ ] `ls skills/` → `batuta init pause plan resume review route status`.
- [ ] `grep -rn "Step 0.4\|Step 0.6\|batuta-plan\|batuta-status\|batuta-route\|batuta-review" routing.md skills/ adapters/ README.md docs/PRD.md` → vazio (sem referências órfãs; specs/planos históricos em docs/superpowers ficam como estão).
- [ ] `git log --oneline -7` — 6 commits da feature presentes e pushados.
