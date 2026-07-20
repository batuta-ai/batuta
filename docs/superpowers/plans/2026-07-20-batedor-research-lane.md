# Batedor (Research Lane) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao Batuta a lane de apoio "Research" — o batedor: executor barato, read-only, em background, que pesquisa a base e devolve relatório estruturado verificado pelo maestro.

**Architecture:** Repo 100% markdown (plugin Claude Code). A mudança é documental-comportamental: segunda tabela em `routing.md`, protocolo do batedor no `SKILL.md`, subseção "Research invocation" nos 3 adapters, docs de usuário em README/PRD. Spec aprovado: `docs/superpowers/specs/2026-07-20-batedor-research-lane-design.md`.

**Tech Stack:** Markdown; verificação por `grep`; commits conventional em PT-BR direto na main.

## Global Constraints

- Idiomas (PRD §9): `routing.md`, `skills/*`, `adapters/*` em **inglês**; `README.md` e `docs/PRD.md` em **PT-BR**.
- Princípio do adapter dormente: nenhuma instrução nova pode mandar varrer adapters/CLIs não referenciados pela tabela.
- Sem escada na lane de pesquisa: fallback é sempre o maestro assumir (nunca "sobe uma linha").
- Contrato do relatório: 4 seções fixas — Answer, Files, Evidence, Uncertain (obrigatória).
- Guarda universal read-only: `git status --porcelain` antes/depois de todo scout; árvore suja → reverter e contar como falha.
- Pesquisa não escreve código, não commita, não entra no `WORK.md`.

---

### Task 1: Support lanes em `routing.md`

**Files:**
- Modify: `routing.md` (append ao final do arquivo, após a linha 65)

**Interfaces:**
- Produces: seção `## Support lanes` com a linha Research — referenciada pelas Tasks 2–5 como "`routing.md`, Support lanes".

- [ ] **Step 1: Adicionar a seção ao final de `routing.md`**

Append após o último bullet de `## Rules`:

```markdown

## Support lanes

Support lanes route work that serves the cycle but is not code writing. They
are orthogonal to the complexity ladder above — the escalation rule ("moves
one row up") does not apply here.

| Role | Examples | Executor | Cost |
|---|---|---|---|
| Research | project map sweep, brief context, "where does X live?" | `<CLI + cheap model>` set at onboarding (e.g. opencode + kimi, `claude -p --model haiku`) | cents (API) |

### Research rules

- The scout is read-only: it answers questions about the codebase and returns
  a structured report (protocol in `skills/batuta/SKILL.md`, "The scout").
  It never writes code, never commits, never appears in `WORK.md`.
- **No ladder:** scout failed twice (original + 1 retry) or executor
  unavailable → the maestro does the research itself. Nothing escalates.
- **Explicit model**, like the trivial lane: the row names the exact CLI and
  model, discovered via the adapter and confirmed once at onboarding — this
  default table carries a placeholder; the project's `.batuta/routing.md`
  carries the real ID.
- **Dormant adapters** apply unchanged: only the adapter this row references
  is read.
```

- [ ] **Step 2: Verificar**

Run: `grep -n "## Support lanes" routing.md && grep -c "Research" routing.md`
Expected: linha da seção + contagem ≥ 2.

- [ ] **Step 3: Commit**

```bash
git add routing.md
git commit -m "feat: lane de apoio Research na tabela de roteamento — o batedor"
```

---

### Task 2: Protocolo do batedor em `skills/batuta/SKILL.md`

**Files:**
- Modify: `skills/batuta/SKILL.md` (frontmatter linha 3; Step 0.4 linhas 29–33; Step 0.6 linhas 39–70; Step 2 linhas 96–116; nova seção antes de "Non-negotiable principles" linha 171)

**Interfaces:**
- Consumes: `routing.md`, Support lanes (Task 1).
- Produces: seção `## The scout — research delegation` referenciada pelos adapters (Tasks 3) e o contrato de relatório de 4 seções.

- [ ] **Step 1: Atualizar a description do frontmatter (gatilho ad-hoc)**

Trocar a linha 3 por:

```yaml
description: Batuta's main entry point. Use when the user requests a code task that can be delegated (feature, bugfix, refactor, config), asks where or how something lives in the codebase (research — see "The scout"), or invokes /batuta. Classifies complexity, routes to the cheapest capable executor, builds the brief, delegates, verifies and commits.
```

- [ ] **Step 2: Step 0.4 — sweep do mapa delega ao batedor**

Trocar "This initial sweep is delegable to a cheap executor." por:

```markdown
This initial sweep is delegated to the Research lane's scout (see "The
   scout" below) when the lane is mapped; the maestro only sweeps itself if
   the lane is unmapped or the scout fails twice.
```

- [ ] **Step 3: Step 0.6 — lane Research na mesma pergunta única**

Adicionar, imediatamente antes de "The user has the final word...":

```markdown
   The same single confirmation question also covers the **Research support
   lane** (`routing.md`, Support lanes): suggest a cheap candidate from the
   discovery already run — filter to `kimi|haiku|mini|nano|flash|free`. Full
   trio or no-codex → a cheap opencode model or `claude -p --model haiku`;
   claude only → haiku via background instance.
```

- [ ] **Step 4: Step 2 — gatilho pré-brief**

Adicionar após o parágrafo "The brief must be self-sufficient...":

```markdown
**Research first:** when building Context requires discovery ("where is X
handled, which files touch Y, how is Z tested"), dispatch the scout (see "The
scout") instead of reading the codebase yourself — the verified report feeds
the Context section; only its distillate enters your context.
```

- [ ] **Step 5: Nova seção "The scout" antes de "Non-negotiable principles"**

```markdown
## The scout — research delegation

Codebase research is delegated to the Research support lane (`routing.md`,
Support lanes): a cheap, read-only executor invoked per the "Research
invocation" section of its adapter, in the background. Three triggers: the
onboarding map sweep (Step 0.4), brief context (Step 2), and ad-hoc user
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

**Read-only guard (universal):** run `git status --porcelain` before and
after every scout; a dirtied tree → revert the changes and count the run as a
scout failure. The adapters' native read-only modes are defense in depth, not
the guarantee.
```

- [ ] **Step 6: Verificar**

Run: `grep -n "The scout" skills/batuta/SKILL.md | head -6 && grep -n "Uncertain" skills/batuta/SKILL.md`
Expected: ocorrências na description, Steps 0.4/2 e na seção nova; contrato presente.

- [ ] **Step 7: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "feat: protocolo do batedor no ciclo — brief de pesquisa, contrato de relatório e verificação estrutural"
```

---

### Task 3: "Research invocation" nos 3 adapters

**Files:**
- Modify: `adapters/opencode.md` (após "## Context passing", antes de "## Capabilities and limits")
- Modify: `adapters/codex.md` (após "## Context passing", antes de "## Capabilities and limits")
- Modify: `adapters/claude.md` (após "## Context passing", antes de "## Capabilities and limits")

**Interfaces:**
- Consumes: contrato do scout (Task 2) e linha Research (Task 1).
- Produces: comando exato de invocação read-only por CLI, citado como "Research invocation" pelo SKILL.md.

- [ ] **Step 1: `adapters/opencode.md`**

```markdown
## Research invocation

For the Research support lane (`routing.md`, Support lanes): same invocation
shape, model from the Research row. opencode has no native read-only mode, so
the research brief MUST state: "Read-only task: do not create, edit or delete
any file." The universal guard from `skills/batuta/SKILL.md` ("The scout") —
`git status --porcelain` before/after, revert + count as failure if dirty —
is the actual guarantee.
```

- [ ] **Step 2: `adapters/codex.md`**

````markdown
## Research invocation

For the Research support lane: native read-only sandbox, model from the
Research row (small/cheap — this is not the complex lane's strong model):

```bash
codex exec --sandbox read-only -m <model> "<research brief>"
```

The sandbox blocks writes; still apply the universal guard from
`skills/batuta/SKILL.md` ("The scout") as defense in depth.
````

- [ ] **Step 3: `adapters/claude.md`**

````markdown
## Research invocation

For the Research support lane: background instance on a cheap model with
write tools blocked:

```bash
claude -p --model haiku --disallowedTools "Write,Edit,NotebookEdit" "<research brief>"
```

Bash remains available for `grep`/`ls`; the universal guard from
`skills/batuta/SKILL.md` ("The scout") covers writes attempted through it.
````

- [ ] **Step 4: Verificar**

Run: `grep -l "Research invocation" adapters/*.md`
Expected: os 3 arquivos (`claude.md`, `codex.md`, `opencode.md`).

- [ ] **Step 5: Commit**

```bash
git add adapters/opencode.md adapters/codex.md adapters/claude.md
git commit -m "feat: invocação read-only de pesquisa nos adapters (sandbox, tools bloqueadas, guarda de git)"
```

---

### Task 4: README — documentação de usuário

**Files:**
- Modify: `README.md` (nova seção após a linha 72, antes de "## Comandos"; ajuste no parágrafo de onboarding, linha 92)

**Interfaces:**
- Consumes: conceito fechado nas Tasks 1–3. Sem consumidores posteriores.

- [ ] **Step 1: Nova seção após o parágrafo da lane Complexa (linha 72)**

```markdown
## O batedor: pesquisa de arquivos por centavos

Além das lanes de execução, o Batuta tem uma **lane de apoio**: a pesquisa.
Quem varre a base atrás de "onde mora X?" não é o maestro — é o *batedor*, um
modelo barato (Kimi, Haiku…) rodando **read-only em background**, que devolve
um relatório curto: resposta, arquivos com linha, evidência e incertezas.

O maestro não confia de olhos fechados: todo path citado passa por `ls`, todo
símbolo por `grep`. Referência fantasma → o batedor tenta de novo com o
feedback; falhou de novo → o maestro pesquisa ele mesmo (pesquisa não sobe a
escada de escalação — o fallback é o maestro).

Isso vale para o mapa do projeto no onboarding, para o contexto dos briefs e
para perguntas suas do tipo "onde é tratado o pagamento?". E pesquisa nunca
escreve código: a árvore git é conferida antes e depois de cada batedor.
```

- [ ] **Step 2: Onboarding (linha 92) — citar a lane de pesquisa**

Adicionar ao final do parágrafo "Ele também **checa quais executores...**", antes de "Uma pergunta de confirmação":

```markdown
A mesma proposta cobre a lane de pesquisa: um modelo de centavos para o batedor (Kimi via opencode, ou Haiku em background).
```

- [ ] **Step 3: Verificar**

Run: `grep -n "batedor" README.md`
Expected: ocorrências na seção nova e no onboarding.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: batedor no README — lane de pesquisa read-only com verificação estrutural"
```

---

### Task 5: PRD — funcionalidade e decisão registrada

**Files:**
- Modify: `docs/PRD.md` (§6.1 linhas 121–123 e 137–149; nova §6.9 após a linha 267; nova linha na tabela do §9, após a linha 308)

**Interfaces:**
- Consumes: tudo anterior. Sem consumidores posteriores.

- [ ] **Step 1: §6.1 — sweep do mapa aponta pro batedor**

Trocar "preenchidas no onboarding — varredura delegável a executor barato." por:

```markdown
preenchidas no onboarding — varredura delegada ao batedor (lane de pesquisa,
§6.9) quando mapeada; o maestro só varre ele mesmo se a lane não existir ou o
batedor falhar duas vezes.
```

No parágrafo "Checagem de executores e mapeamento de lanes", adicionar antes de "Tudo numa única pergunta de confirmação":

```markdown
A mesma proposta cobre a lane de apoio de pesquisa (§6.9): candidato barato
vindo da mesma descoberta (filtro kimi/haiku/mini/nano/flash).
```

- [ ] **Step 2: Nova §6.9 após §6.8**

```markdown
### 6.9 Lane de apoio: pesquisa (o batedor)

Pesquisa de arquivos (onde mora X, o que toca Y, como Z é testado) é delegada
a uma **lane de apoio**, ortogonal à escada de complexidade: o *batedor* — um
executor barato, read-only, definido numa segunda tabela do `routing.md`
("Support lanes") e confirmado na mesma pergunta única do onboarding. Três
gatilhos: varredura do mapa no onboarding, contexto pré-brief e perguntas
ad-hoc do usuário sobre a base.

- **Contrato de relatório** com 4 seções fixas (resposta; arquivos com linha;
  evidência; incertezas — obrigatória) viaja em todo research brief: modelo
  pequeno segue formato literal.
- **Verificação estrutural barata** antes de consumir: paths citados via
  `ls`, símbolos via `grep`. Âncora fantasma → 1 retry com feedback; segunda
  falha → o maestro pesquisa ele mesmo. Sem escada: o fallback da lane é
  sempre o maestro.
- **Read-only garantido pela guarda universal** (`git status --porcelain`
  antes/depois; árvore suja → reverte e conta como falha), com os modos
  nativos dos CLIs (`codex --sandbox read-only`, tools bloqueadas no
  `claude -p`) como defesa em profundidade.
- Pesquisa não escreve código, não commita e não entra no `WORK.md`.
- Execução em background com fan-out: perguntas independentes viram batedores
  paralelos enquanto o maestro segue conduzindo.
```

- [ ] **Step 3: §9 — linha de decisão**

Adicionar após a linha "| Variante Claude na lane complexa |...":

```markdown
| Batedor (lane de pesquisa) | Segunda tabela "Support lanes" no `routing.md` com executor barato read-only para varredura de mapa, contexto de brief e perguntas ad-hoc; relatório de contrato fixo, verificação estrutural (`ls`/`grep`), guarda de git e fallback para o maestro | Pesquisa era paga pelo modelo caro da sessão; um modelo de centavos em background devolve o destilado. Ortogonal à escada (falha não escala — volta ao maestro); modo de falha silencioso de modelo pequeno (referência inventada) é coberto pela verificação estrutural, que custa centavos e não traz conteúdo ao contexto premium |
```

- [ ] **Step 4: Verificar**

Run: `grep -n "6.9\|batedor" docs/PRD.md | head -12`
Expected: §6.1 referenciando §6.9, seção 6.9 presente, linha no §9.

- [ ] **Step 5: Commit e push**

```bash
git add docs/PRD.md
git commit -m "docs: PRD — lane de apoio de pesquisa (batedor) e decisão registrada"
git push origin main
```

---

## Verificação final do plano (após Task 5)

- [ ] `grep -rn "Support lanes" routing.md skills/ adapters/` — referências consistentes.
- [ ] Releitura das seções novas conferindo idioma (inglês em tool files, PT-BR em docs).
- [ ] `git log --oneline -6` — 5 commits da feature presentes e pushados.
