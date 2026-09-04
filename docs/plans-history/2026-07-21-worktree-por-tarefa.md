# Worktree por tarefa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O executor trabalha num git worktree isolado por tarefa (commits WIP livres), o maestro revisa e testa no branch e integra por squash no main com a mensagem dele — configurável no profile (`Worktree: off | medium+ | always`, default `medium+`) com linha `Install:` opcional para o ambiente de testes.

**Architecture:** Edições no ciclo (`skills/batuta/SKILL.md`, Steps 1.5/3/4/5) condicionadas à linha `Worktree` do profile; perguntas novas no init (primeira execução + reconfigure); documentação em README e PRD. Worktrees vivem em `.batuta/worktrees/<slug>` (branch `batuta/<slug>`), ignorados via `.git/info/exclude` — nunca via `.gitignore`, que é arquivo do usuário.

**Tech Stack:** Plugin Claude Code — arquivos Markdown apenas; sem suite de testes: verificação por grep com saída esperada e leitura.

**Spec:** `docs/superpowers/specs/2026-07-21-worktree-por-tarefa-design.md`

## Global Constraints

- Idiomas (PRD §9): skills em **inglês**; README/PRD em **PT-BR**.
- Perfil sem a linha `Worktree` = modo `off`: nenhum comportamento muda para projetos já configurados; o texto atual é o baseline de degradação.
- Autoridade do commit é do maestro: squash sempre, mensagem pela metodologia do profile; o histórico WIP do executor nunca chega ao main. Um task verificado = um commit no main.
- Fronteira de escrita: Batuta escreve em `WORK.md`, `.batuta/` e código via ciclo — por isso o ignore dos worktrees vai em `.git/info/exclude` (local, não versionado), nunca em `.gitignore`.
- Fallback de ambiente de teste nunca é silencioso: sempre declarado.
- Nomes literais: linhas `Worktree: off | medium+ | always` e `Install: <command>` no `.batuta/profile.md`; dir `.batuta/worktrees/<slug>`; branch `batuta/<slug>`.
- Em tabelas markdown do PRD, nunca usar `|` dentro de célula — escrever `` `off`/`medium+`/`always` ``.
- Um task verificado = um commit (mensagens em PT-BR, prefixos `feat:`/`docs:` como no histórico do repo).

---

### Task 1: Caminho worktree no ciclo (`skills/batuta/SKILL.md`)

**Files:**
- Modify: `skills/batuta/SKILL.md` (Steps 1.5, 3, 4 e 5)

**Interfaces:**
- Produces: os nomes que as Tasks 2–4 citam — linhas `Worktree:`/`Install:` do profile, dir `.batuta/worktrees/<slug>`, branch `batuta/<slug>`, squash pelo maestro.

- [ ] **Step 1: Step 1.5 — modo worktree vale por item**

Localizar o fim do parágrafo **Execution mode** (Step 1.5):

```markdown
follow Step 3's parallelism, but verification and commit remain per item,
as each executor returns.
```

Trocar por:

```markdown
follow Step 3's parallelism, but verification and commit remain per item,
as each executor returns. The profile's Worktree line (Step 3) also applies
per item: each task's cycle gets its own worktree when its lane calls for it.
```

- [ ] **Step 2: Step 3 — parágrafo Worktree**

Localizar o fim do primeiro parágrafo do Step 3:

```markdown
invocation must carry it — a delegation without the row's model flags is a
routing bug, not a shortcut.
```

Adicionar logo após, como parágrafo próprio (antes de **Parallelism:**):

```markdown
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
```

- [ ] **Step 3: Step 3 — paralelismo usa o mesmo mecanismo**

Trocar:

```markdown
executors in the background (`run_in_background`), one git worktree per
executor when file conflicts are likely.
```

por:

```markdown
executors in the background (`run_in_background`). With the Worktree line
active each task already runs in its own worktree; with it `off`, create
one worktree per executor when file conflicts are likely.
```

- [ ] **Step 4: Step 4 — verificação no branch e ambiente de testes**

Localizar o fim da lista numerada do Step 4:

```markdown
3. **Acceptance criteria** — check them one by one against the brief.
```

Adicionar logo após, como parágrafo próprio (antes de "Failed →"):

```markdown
**In a worktree** (Step 3): the diff review reads
`git diff main...batuta/<slug>`, and tests run inside the worktree. If the
test command fails for environment reasons (missing dependencies — not a
red test), run the profile's Install command inside the worktree and retry
once; no Install line → declare the fallback out loud and run the tests on
the main checkout with the item's diff applied — never silently.
```

- [ ] **Step 5: Step 4 — retry e escalação no worktree**

Trocar:

```markdown
Failed → send the diff + specific feedback back to the executor and allow
**1 retry**. Failed again → **escalate**: the task moves one row up the routing
table and the cycle restarts at Step 2 (brief enriched with what was learned).
```

por:

```markdown
Failed → send the diff + specific feedback back to the executor and allow
**1 retry**. Failed again → **escalate**: the task moves one row up the routing
table and the cycle restarts at Step 2 (brief enriched with what was learned).
In a worktree, the retry happens in the same worktree; an escalation resets
the branch (`git reset --hard main`) before the next executor takes over. An
item that fails definitively has its worktree and branch removed — the main
checkout was never touched.
```

- [ ] **Step 6: Step 5 — integração por squash**

Localizar o item 1 do Step 5:

```markdown
1. Atomic commit: one verified task = one commit (message per the profile's
   methodology). N tasks delivered = N commits — batching multiple tasks
   into one commit is a cycle violation, not a shortcut.
```

Trocar por:

```markdown
1. Atomic commit: one verified task = one commit (message per the profile's
   methodology). N tasks delivered = N commits — batching multiple tasks
   into one commit is a cycle violation, not a shortcut. In a worktree,
   integrate by squash on the main checkout — `git merge --squash
   batuta/<slug>`, then commit with the maestro's message: the executor's
   WIP history never reaches main. Then remove the worktree and branch
   (`git worktree remove .batuta/worktrees/<slug>`,
   `git branch -D batuta/<slug>`).
```

- [ ] **Step 7: Verificar**

Run: `grep -c 'batuta/<slug>' skills/batuta/SKILL.md && grep -c 'Worktree' skills/batuta/SKILL.md && grep -c 'gitignore' skills/batuta/SKILL.md`
Expected: `4` linhas (Step 3 add, Step 4 diff, Step 5 squash e delete), `3` linhas (Step 1.5, Step 3 header, Step 3 paralelismo — grep conta linhas, e "worktree" minúsculo do Step 4 não entra) e `1` (a proibição no Step 3)

- [ ] **Step 8: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "feat: ciclo ganha o caminho worktree por tarefa (Steps 1.5, 3–5)"
```

---

### Task 2: Perguntas no init (`skills/init/SKILL.md`)

**Files:**
- Modify: `skills/init/SKILL.md` (first run step 2; reconfigure step 3)

**Interfaces:**
- Consumes: linhas `Worktree:`/`Install:` definidas na Task 1.

- [ ] **Step 1: First run — duas perguntas novas**

Localizar o último bullet da lista de perguntas do first-run step 2:

```markdown
   - Batch execution: sequential (default) or parallel? (how decomposed
     multi-item requests run — see Step 1.5 of the cycle; the answer becomes
     the profile's Execution line, written as a literal line, e.g.
     `Execution: sequential`)
```

Adicionar logo após, na mesma lista:

```markdown
   - Worktree mode: `off`, `medium+` (default) or `always`? (whether the
     executor works in an isolated git worktree per task — see Steps 3–5 of
     the cycle; the answer becomes the profile's literal line, e.g.
     `Worktree: medium+`)
   - Install command? (optional — sets up the test environment inside a
     worktree, e.g. `npm install`; becomes the profile's `Install:` line,
     omitted when there is none)
```

- [ ] **Step 2: Reconfigure — opções novas**

Localizar (reconfigure step 3):

```markdown
   the batch execution mode (sequential ↔ parallel, the profile's Execution line),
   or a fresh map sweep (delegated to the scout, like first-run step 4).
```

Trocar por:

```markdown
   the batch execution mode (sequential ↔ parallel, the profile's Execution line),
   the worktree mode or Install command (the profile's Worktree and Install
   lines), or a fresh map sweep (delegated to the scout, like first-run step 4).
```

- [ ] **Step 3: Verificar**

Run: `grep -c 'Worktree' skills/init/SKILL.md && grep -c 'Install' skills/init/SKILL.md`
Expected: `3` (pergunta, exemplo literal, reconfigure) e `3` (pergunta, linha do profile, reconfigure)

- [ ] **Step 4: Commit**

```bash
git add skills/init/SKILL.md
git commit -m "feat: init pergunta modo worktree e comando de instalação"
```

---

### Task 3: Documentação (README + PRD)

**Files:**
- Modify: `README.md` (nova seção entre "## Paralelismo" e "## Integração com superpowers")
- Modify: `docs/PRD.md` (§5.2 árvore, §6.1 lista, §6.3, §9 tabela)

**Interfaces:**
- Consumes: nomes da Task 1 (consistência PT-BR × EN).

- [ ] **Step 1: README — nova seção após o parágrafo de "## Paralelismo"**

Inserir antes de `## Integração com superpowers`:

```markdown
## Worktree por tarefa

Com a linha `Worktree` do perfil (`off`/`medium+`/`always`, default
`medium+` no onboarding), o executor trabalha num git worktree isolado por
tarefa: commita à vontade lá (WIP), o maestro revisa e testa no branch e,
aprovado, integra com squash no main escrevendo a mensagem do commit — um
task verificado continua sendo um commit atômico, e trabalho rejeitado é só
deletar o worktree, sem revert no seu checkout. Em `medium+`, tarefas
triviais ficam no checkout principal (worktree para trocar uma string é
cerimônia demais); `always` leva tudo para worktree; `off` mantém o
comportamento clássico. A linha opcional `Install:` do perfil prepara o
ambiente de testes dentro do worktree quando necessário.
```

- [ ] **Step 2: PRD §5.2 — worktrees na árvore de artefatos**

Localizar:

```
    ├── profile.md         # perfil do projeto (onboarding da primeira execução)
    └── plan-<slug>.md     # planos formais, quando existirem
```

Trocar por:

```
    ├── profile.md         # perfil do projeto (onboarding da primeira execução)
    ├── plan-<slug>.md     # planos formais, quando existirem
    └── worktrees/<slug>/  # worktree transitório por tarefa (modo Worktree; ignorado via .git/info/exclude)
```

- [ ] **Step 3: PRD §6.1 — bullet na lista de perguntas do onboarding**

Localizar:

```markdown
- **Lotes decompostos** — execução sequencial (default) ou paralela.
```

Adicionar logo após:

```markdown
- **Worktree e instalação** — modo worktree por tarefa (`off`/`medium+`/`always`,
  default `medium+`) e comando de instalação opcional para o ambiente de
  testes dos worktrees.
```

- [ ] **Step 4: PRD §6.3 — parágrafo do fluxo worktree**

Localizar o fim da lista numerada do §6.3:

```markdown
5. **Registrar** — uma linha no `WORK.md`.
```

Adicionar logo após, como parágrafo próprio:

```markdown
**Worktree por tarefa:** com a linha `Worktree` do perfil
(`off`/`medium+`/`always`; default `medium+`, perguntada no init; perfil sem
a linha = `off`), os passos 2–4 acontecem num worktree isolado
(`.batuta/worktrees/<slug>`, branch `batuta/<slug>`): o executor commita WIP
livremente, a verificação lê o diff do branch e roda os testes lá — com a
linha opcional `Install:` preparando o ambiente; sem ela, fallback declarado
no checkout principal — e a integração é squash-merge feito pelo maestro com
a mensagem da metodologia: o histórico WIP nunca chega ao main. Retry no
mesmo worktree; escalada reseta o branch; falha definitiva deleta worktree e
branch com o main intocado. Em `medium+`, a lane trivial fica no checkout
principal.
```

- [ ] **Step 5: PRD §9 — nova linha no fim da tabela**

```markdown
| Worktree por tarefa | Executor commita WIP em worktree próprio (`.batuta/worktrees/<slug>`, branch `batuta/<slug>`); maestro verifica no branch e integra por squash com a mensagem da metodologia; perfil ganha `Worktree` (`off`/`medium+`/`always`, default `medium+`) e `Install:` opcional; ignore local via `.git/info/exclude` | Isolamento de verdade: o main nunca fica sujo e rejeição é deletar o worktree, não reverter; squash preserva o commit atômico e a autoridade da mensagem com o maestro; gate por lane evita cerimônia em tarefa trivial; exclude local respeita a fronteira de escrita (`.gitignore` é do usuário) |
```

- [ ] **Step 6: Verificar consistência**

Run: `grep -c 'Worktree' README.md docs/PRD.md`
Expected: README ≥ 2, PRD ≥ 4

Run: `grep -n 'worktrees/<slug>' docs/PRD.md | head -5`
Expected: ocorrências no §5.2, §6.3 e §9; conferir por leitura que os três lugares dizem o mesmo default (`medium+`) e o mesmo mecanismo (squash pelo maestro)

- [ ] **Step 7: Commit**

```bash
git add README.md docs/PRD.md
git commit -m "docs: README e PRD documentam o worktree por tarefa"
```
