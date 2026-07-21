# Decomposição no Ciclo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o Step 1.5 (Decompose) ao ciclo do Batuta para que pedidos multi-entregável virem N ciclos com N commits atômicos, com modo de execução configurável no perfil.

**Architecture:** O Batuta é um plugin Claude Code feito de instruções em markdown — não há código executável nem suite de testes. A mudança vive no skill do ciclo (`skills/batuta/SKILL.md`), no onboarding (`skills/init/SKILL.md`) e na documentação (README, PRD). Verificação é por `grep` do conteúdo inserido e leitura de coerência.

**Tech Stack:** Markdown puro. Skills/adapters em inglês; README/PRD em PT-BR (decisão registrada no PRD §9).

**Spec:** `docs/superpowers/specs/2026-07-21-decomposicao-ciclo-design.md`

## Global Constraints

- Instruções para ferramentas (skills) em **inglês**; docs de usuário (README, PRD) em **PT-BR**.
- Estado é prosa; nunca introduzir formato rígido/schema.
- Não tocar `routing.md` (fora de escopo na spec) nem criar comando novo.
- Conventional commits, direto na `main` (padrão atual do repo).
- Cada task deste plano termina no seu próprio commit (dogfooding da própria regra).

---

### Task 1: Step 1.5 no ciclo (`skills/batuta/SKILL.md`)

**Files:**
- Modify: `skills/batuta/SKILL.md` (Steps 1.5 novo, 2, 3, 4, 5)

**Interfaces:**
- Produces: o termo "execution mode" e a linha `Execution` do `.batuta/profile.md`, que a Task 2 referencia; a regra "one task = smallest deliverable verifiable and committable on its own", que Tasks 3–4 documentam.

- [ ] **Step 1: Inserir o Step 1.5 — Decompose**

Inserir entre o fim do Step 1 (após o parágrafo "Ambiguous or large task? …") e o heading `## Step 2 — Brief`:

```markdown
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
as each executor returns.
```

- [ ] **Step 2: Economia de lote no Step 2 — Brief**

Adicionar ao fim do Step 2 (após o parágrafo "**Map upkeep …**"):

```markdown
**Batch economy:** in a decomposed batch (Step 1.5), build Context +
Conventions once — including any scout dispatch — and reuse the block across
the batch's briefs; only Goal, acceptance criteria and boundaries vary per
item. Six cycles must not cost six times the research.
```

- [ ] **Step 3: Alinhar o parágrafo de paralelismo do Step 3 ao modo de execução**

Substituir no Step 3 — Delegate:

```markdown
**Parallelism:** independent tasks run in parallel — executors in the background
```

por:

```markdown
**Parallelism:** when the execution mode calls for it (Step 1.5 — profile set
to `parallel`, or the user asks), independent tasks run in parallel —
executors in the background
```

- [ ] **Step 4: Falha no meio do lote (Step 4 — Verify)**

Adicionar ao fim do Step 4, após o parágrafo "Failed → … (brief enriched with what was learned).":

```markdown
In a batch (Step 1.5), a task that fails even after escalation is skipped:
continue with the remaining independent items and report the failure at the
end. Items that depended on the failed one are blocked and reported — never
executed blindly.
```

- [ ] **Step 5: Reforço no Step 5 — Commit and record**

Substituir:

```markdown
1. Atomic commit: one verified task = one commit (message per the profile's
   methodology).
```

por:

```markdown
1. Atomic commit: one verified task = one commit (message per the profile's
   methodology). N tasks delivered = N commits — batching multiple tasks
   into one commit is a cycle violation, not a shortcut.
```

- [ ] **Step 6: Verificar**

Run: `grep -c "Step 1.5" skills/batuta/SKILL.md`
Expected: `4` ou mais (heading + referências nos Steps 2/3/4).

Run: `grep -n "cycle violation" skills/batuta/SKILL.md`
Expected: uma ocorrência, no Step 5.

Reler o arquivo inteiro e conferir: numeração dos steps intacta, nenhuma contradição entre o default sequencial (Step 1.5) e o parágrafo de paralelismo (Step 3).

- [ ] **Step 7: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "feat: Step 1.5 Decompose — full cycle and atomic commit per item"
```

---

### Task 2: Modo de execução no onboarding (`skills/init/SKILL.md`)

**Files:**
- Modify: `skills/init/SKILL.md` (first run step 2; reconfigure step 3)

**Interfaces:**
- Consumes: a linha `Execution` do profile e os valores `sequential`/`parallel` definidos na Task 1.

- [ ] **Step 1: Pergunta no first run**

No first run, step 2 ("Ask 3–5 short questions, all at once:"), adicionar um bullet após "Test command? Build command?":

```markdown
   - Batch execution: sequential (default) or parallel? (how decomposed
     multi-item requests run — see Step 1.5 of the cycle; the answer becomes
     the profile's Execution line)
```

- [ ] **Step 2: Modo de execução no reconfigure**

No reconfigure, step 3, substituir:

```markdown
   or a fresh map sweep (delegated to the scout, like first-run step 4).
```

por:

```markdown
   the batch execution mode (sequential ↔ parallel, the profile's Execution
   line), or a fresh map sweep (delegated to the scout, like first-run step 4).
```

- [ ] **Step 3: Verificar**

Run: `grep -n "Execution line" skills/init/SKILL.md`
Expected: 2 ocorrências (first run + reconfigure).

Run: `grep -rn "Execution line" skills/batuta/SKILL.md`
Expected: 1 ocorrência (Step 1.5) — nomes consistentes entre os dois skills.

- [ ] **Step 4: Commit**

```bash
git add skills/init/SKILL.md
git commit -m "feat: init asks batch execution mode (sequential default)"
```

---

### Task 3: Documentar a garantia no README (`README.md`)

**Files:**
- Modify: `README.md` (após o parágrafo de escalação, linha ~55)

**Interfaces:**
- Consumes: as decisões da spec (ciclo por item, sequencial default, anuncia-e-executa).

- [ ] **Step 1: Parágrafo de decomposição**

Inserir após o parágrafo "Se a verificação falhar, o executor recebe o feedback e tenta **uma vez** de novo. Falhou de novo? A tarefa **escala automaticamente** para um executor mais capaz.":

```markdown
E se o pedido for uma lista — 6 componentes, por exemplo? O maestro
**decompõe antes de delegar**: cada item vira um ciclo próprio (brief →
delegação → verificação → commit), um de cada vez. 6 componentes = 6 commits
atômicos, não um commitzão no final. Prefere paralelo? Configura no
onboarding ou pede na hora ("roda em paralelo").
```

- [ ] **Step 2: Verificar**

Run: `grep -n "decompõe antes de delegar" README.md`
Expected: 1 ocorrência, entre o diagrama do ciclo e a seção "Roteamento por complexidade".

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README documenta a decomposição e o commit por item"
```

---

### Task 4: PRD — ciclo, paralelismo e decisão registrada (`docs/PRD.md`)

**Files:**
- Modify: `docs/PRD.md` (§6.3, §6.5, §9)

**Interfaces:**
- Consumes: a regra da unidade e as decisões da spec.

- [ ] **Step 1: §6.3 — parágrafo de decomposição antes da lista do ciclo**

Inserir entre o heading `### 6.3 Ciclo de execução (único, sem fases)` e o item "1. **Brief** …":

```markdown
Um task é o menor entregável que pode ser verificado e commitado sozinho.
Pedido com mais de um entregável (lista de componentes, escopo plural) é
decomposto antes do brief: cada item percorre o ciclo inteiro abaixo e
termina no próprio commit — sequencial por default; `parallel` opcional via
perfil, com override verbal por tarefa. Itens acoplados que não podem ser
verificados separadamente permanecem um task só, como exceção declarada no
anúncio. Falha de um item (mesmo após escalada) pula o item e bloqueia só os
dependentes; os independentes seguem.
```

- [ ] **Step 2: §6.5 — default sequencial**

Adicionar ao fim da lista do §6.5 (após "- Detecção em runtime; nenhuma dependência rígida."):

```markdown
- Lotes decompostos (§6.3) são sequenciais por default; paralelismo entra
  pela linha Execution do perfil ou por pedido verbal. Mesmo em paralelo,
  verificação e commit são por item.
```

- [ ] **Step 3: §9 — nova linha de decisão**

Adicionar ao fim da tabela do §9:

```markdown
| Decomposição no ciclo | Step 1.5: pedido multi-entregável vira N tasks (menor unidade verificável e commitável), ciclo inteiro e commit por item; sequencial default com `parallel` no perfil; anuncia e executa sem parada de confirmação | Feedback de uso real (2026-07-20): a lista inteira virava um brief e um commit no final — o commit atômico do §6.3 só se sustenta se a decomposição definir o que é "um task", e a verificação por item impede que uma falha contamine o lote |
```

- [ ] **Step 4: Verificar**

Run: `grep -n "menor entregável" docs/PRD.md`
Expected: 2 ocorrências (§6.3 e §9).

Run: `grep -c "^|" docs/PRD.md`
Expected: uma linha a mais que antes da edição na tabela do §9 (conferir que a tabela não quebrou: `| Decomposição no ciclo |` presente).

- [ ] **Step 5: Commit e push**

```bash
git add docs/PRD.md
git commit -m "docs: PRD registra decomposição no ciclo (§6.3, §6.5, §9)"
git push
```
