# Integração com superpowers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando o superpowers está instalado, o Batuta conduz brainstorming, planejamento, execução, review e debugging pelo método das skills dele — mantendo artefatos, routing e commits sob as regras do Batuta.

**Architecture:** Um documento central dormante (`superpowers.md` na raiz do plugin, padrão do `routing.md`/adapters) concentra detecção, autoridade e o mapa momento→skill→adaptação. As skills (`batuta`, `plan`, `review`) ganham ponteiros de uma linha. O brief ganha uma linha de método condicional para executores externos que tenham superpowers do lado deles. README e PRD registram a decisão.

**Tech Stack:** Plugin Claude Code — arquivos Markdown apenas; verificação por leitura e `grep`. Não há suite de testes: os passos de verificação são greps com saída esperada.

**Spec:** `docs/superpowers/specs/2026-07-21-integracao-superpowers-design.md`

## Global Constraints

- Idiomas (PRD §9): instruções para ferramentas (skills, `superpowers.md`) em **inglês**; docs de usuário (README, PRD) em **PT-BR**.
- Com superpowers ausente, nenhuma skill muda de comportamento — todo ponteiro é condicional ("with superpowers installed…"); o texto atual é o baseline de degradação e permanece válido.
- Integração automática: nenhuma mudança em `skills/init/SKILL.md`, adapters ou `routing.md`.
- Batuta manda: artefatos em `.batuta/`/`WORK.md`, implementadores do routing table, verify/commit por item — nenhum ponteiro pode contradizer isso.
- Um task verificado = um commit (mensagens em PT-BR, prefixos `feat:`/`docs:` como no histórico recente do repo).

---

### Task 1: Criar `superpowers.md` na raiz do plugin

**Files:**
- Create: `superpowers.md` (raiz do repo, ao lado de `routing.md`)

**Interfaces:**
- Produces: as âncoras que os ponteiros das Tasks 2–3 citam — o título "Method in the brief", as linhas da tabela ("batch orchestration", "claude lane", "verification", "debugging") e a citação em bloco da method line.

- [ ] **Step 1: Escrever o arquivo com este conteúdo exato**

````markdown
# Superpowers integration — borrowed method, Batuta's rules

How the maestro conducts the cycle when the
[superpowers](https://github.com/obra/superpowers) plugin is installed.
Dormant like the adapters: skills point here in one line; read this file
only when a pointer fires.

## Universal rules

- **Detection:** at runtime, at the moment of conducting the step —
  superpowers is installed when `superpowers:*` skills appear in the
  session's available skills. No hard dependency: absent → the step runs
  exactly as the skill's own text describes. The skills' baseline text IS
  the degradation path; this file only changes *how* a step is conducted,
  never *what* it delivers.
- **Authority:** superpowers supplies the *method* — the questions, the
  rigor, the checklists. Batuta supplies the *material rules*: artifacts
  live in `.batuta/` and `WORK.md`, implementers come from the routing
  table, verification and commit are per item (Steps 4–5). When a
  superpowers skill says to write to `docs/superpowers/`, to use Claude
  subagents as implementers, or to skip Step 4/5, Batuta's rule prevails.

## Method in the brief (external executors)

codex and opencode may have superpowers installed on *their* side — Batuta
cannot see the executor's environment. Every code brief therefore carries
one conditional method line, verbatim:

> Method: if superpowers skills are available in your environment, conduct
> the work with them — `test-driven-development` for implementation,
> `systematic-debugging` for bug investigation. Otherwise, work test-first
> from the acceptance criteria.

It degrades on its own: an executor without superpowers ignores the
condition and follows the baseline. No detection, no per-executor
configuration.

## Map — cycle moment → skill → what Batuta keeps

| Cycle moment | Superpowers skill | What Batuta keeps |
|---|---|---|
| Ambiguous/creative request (Step 1) | `brainstorming` | design feeds the brief or plan; artifacts in `.batuta/`, never `docs/superpowers/` |
| `/batuta:plan` | `writing-plans` (method) | `.batuta/plan-<slug>.md` format and location; predicted executor per task; user approval before executing |
| Batch orchestration (Steps 1.5/3) | `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees` | each "subagent" is an external executor from the routing table; verify/commit per item, never batched |
| Verification (Step 4) and `/batuta:review` | `requesting-code-review`, `verification-before-completion` | the brief's criteria, traceability test, retry/escalation ladder, verdict |
| Critical bugfix or post-escalation failure | `systematic-debugging` | findings feed the enriched re-brief; escalation follows the routing table |
| claude lane (critical tasks) | `test-driven-development`, `verification-before-completion` | atomic commit and `WORK.md` record (Step 5) |

### Adaptation per moment

- **Ambiguous request (Step 1):** conduct the clarifying questions with
  `brainstorming`'s method — one question at a time, approaches with
  trade-offs before settling. The outcome is still inline planning (plain
  text in the conversation) or a handoff to `/batuta:plan`; no design doc.
- **`/batuta:plan`:** decomposition, dependency analysis and task
  right-sizing follow `writing-plans`; the artifact is
  `.batuta/plan-<slug>.md` in the existing format, with predicted executor
  per task, and execution still waits for user approval.
- **Batch orchestration:** `subagent-driven-development` conducts the
  dispatch/collect/review loop; `dispatching-parallel-agents` and
  `using-git-worktrees` conduct parallel distribution. Who implements is
  the routed lane's executor, never a Claude subagent; verification and
  commit remain per item as each executor returns.
- **Verification:** run Step 4 with `requesting-code-review`'s reviewer
  rigor and `verification-before-completion`'s evidence-before-claims. The
  criteria remain the brief's; the verdict and the retry/escalation ladder
  remain Batuta's.
- **Debugging:** a bugfix classified critical, or an item that failed
  Step 4 even after escalation, is investigated with
  `systematic-debugging`; findings feed the enriched re-brief.
- **claude lane:** when the maestro implements (critical tasks), work
  test-first with `test-driven-development` and close with
  `verification-before-completion` before Step 5's atomic commit.
````

- [ ] **Step 2: Verificar estrutura**

Run: `grep -c '^| ' superpowers.md && grep -n 'Method:' superpowers.md`
Expected: `8` (2 linhas de cabeçalho + 6 do mapa) e uma linha com `> Method: if superpowers skills are available`

- [ ] **Step 3: Commit**

```bash
git add superpowers.md
git commit -m "feat: superpowers.md — integração central (método emprestado, regras do Batuta)"
```

---

### Task 2: Ponteiros no ciclo (`skills/batuta/SKILL.md`)

**Files:**
- Modify: `skills/batuta/SKILL.md` (Steps 1, 2, 3 e 4)

**Interfaces:**
- Consumes: âncoras da Task 1 (`superpowers.md`: "Method in the brief", linhas do mapa).

- [ ] **Step 1: Step 1 — pedido ambíguo conduz por brainstorming**

Localizar o parágrafo (após a lista numerada do Step 1):

```markdown
Ambiguous or large task? Before routing, ask 2–3 questions and sketch the plan
in plain text in the conversation (inline planning — no artifact). If the work
```

Trocar a primeira frase por:

```markdown
Ambiguous or large task? Before routing, ask 2–3 questions and sketch the plan
in plain text in the conversation (inline planning — no artifact); with
superpowers installed, conduct the questions by the `brainstorming` method
(`superpowers.md`, Step 1 row). If the work
```

- [ ] **Step 2: Step 2 — linha de método no brief**

Localizar:

```markdown
The brief must be self-sufficient: the executor has no access to the conversation.
```

Adicionar logo após, como parágrafo próprio:

```markdown
**Method line:** every code brief also carries the conditional method line
from `superpowers.md` ("Method in the brief") — the executor may have
superpowers on its side; without it the line degrades to test-first by the
acceptance criteria.
```

- [ ] **Step 3: Step 3 — ponteiro no paralelismo e na lane claude**

Trocar:

```markdown
If the superpowers plugin is installed, use its
`dispatching-parallel-agents` and `using-git-worktrees` skills to conduct the
distribution; without it, use native capabilities. Detect at runtime; no hard
dependency.
```

por:

```markdown
With superpowers
installed, conduct the distribution per `superpowers.md` (batch orchestration
row); without it, use native capabilities. Detect at runtime; no hard
dependency.
```

E trocar:

```markdown
The `claude.md` adapter = you execute it
yourself (critical tasks only).
```

por:

```markdown
The `claude.md` adapter = you execute it
yourself (critical tasks only) — with superpowers installed, test-first per
`superpowers.md` (claude lane row).
```

- [ ] **Step 4: Step 4 — review e debugging**

Localizar a abertura do Step 4:

```markdown
Always, no exceptions:
```

Adicionar logo após, antes da lista numerada:

```markdown
With superpowers installed, conduct this step per `superpowers.md`
(verification row); a critical bugfix, or a failure that survives
escalation, is investigated per its debugging row before the re-brief.
```

- [ ] **Step 5: Verificar**

Run: `grep -c 'superpowers.md' skills/batuta/SKILL.md && grep -c 'dispatching-parallel-agents' skills/batuta/SKILL.md`
Expected: `5` e `0` (a menção inline antiga saiu; cinco ponteiros: Steps 1, 2, 3×2, 4)

- [ ] **Step 6: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "feat: ciclo aponta para superpowers.md nos Steps 1–4"
```

---

### Task 3: Ponteiros em `plan` e `review`

**Files:**
- Modify: `skills/plan/SKILL.md`
- Modify: `skills/review/SKILL.md`

**Interfaces:**
- Consumes: âncoras da Task 1 (linhas `/batuta:plan` e verification do mapa).

- [ ] **Step 1: `skills/plan/SKILL.md`**

Localizar:

```markdown
## How

1. Understand the goal; ask the missing questions (few, all at once).
```

Adicionar entre o título e o item 1:

```markdown
With superpowers installed, conduct steps 1–2 by the `writing-plans` method
(plugin root `superpowers.md`, `/batuta:plan` row); artifact, format and
approval below stay unchanged.

```

- [ ] **Step 2: `skills/review/SKILL.md`**

Localizar:

```markdown
Re-runs the cycle's verification step over any diff, delegating nothing.
```

Adicionar logo após, como parágrafo próprio:

```markdown
With superpowers installed, conduct the review with the rigor of
`requesting-code-review` and `verification-before-completion`
(plugin root `superpowers.md`, verification row); the steps and the verdict
below stay unchanged.
```

- [ ] **Step 3: Verificar**

Run: `grep -c 'superpowers.md' skills/plan/SKILL.md skills/review/SKILL.md`
Expected: `skills/plan/SKILL.md:1` e `skills/review/SKILL.md:1`

- [ ] **Step 4: Commit**

```bash
git add skills/plan/SKILL.md skills/review/SKILL.md
git commit -m "feat: plan e review apontam para superpowers.md"
```

---

### Task 4: Documentação (README + PRD)

**Files:**
- Modify: `README.md` (nova subseção após "## Paralelismo", linha ~130)
- Modify: `docs/PRD.md` (§5.1 árvore, §6.5, §9 tabela)

**Interfaces:**
- Consumes: nomes e princípios da Task 1 (consistência PT-BR × EN).

- [ ] **Step 1: README — nova seção após o parágrafo de "## Paralelismo"**

```markdown
## Integração com superpowers

Se você tem o plugin [superpowers](https://github.com/obra/superpowers)
instalado, o Batuta rege os passos do ciclo com as skills dele — brainstorming
para pedidos ambíguos, `writing-plans` no planejamento, o loop de
subagent-driven-development na orquestração de lotes, o rigor de code review
na verificação, `systematic-debugging` em falhas e TDD quando o próprio
maestro implementa. O método é do superpowers; as regras são do Batuta:
artefatos em `.batuta/` e `WORK.md`, implementadores vêm da tabela de
roteamento, verificação e commit por item. Todo brief ainda carrega uma
instrução condicional para executores (codex, opencode) que tenham o
superpowers do lado deles. Tudo automático e sem dependência: sem o plugin,
cada passo segue exatamente como descrito acima. O mapa completo vive em
`superpowers.md` na raiz do plugin.
```

- [ ] **Step 2: PRD §5.1 — adicionar à árvore, após a linha de `routing.md`**

```
├── superpowers.md         # integração com superpowers: método emprestado, regras do Batuta
```

- [ ] **Step 3: PRD §6.5 — atualizar o bullet de superpowers**

Trocar:

```markdown
- **Com superpowers instalado:** usa `dispatching-parallel-agents` e
  `using-git-worktrees` para reger a distribuição.
```

por:

```markdown
- **Com superpowers instalado:** rege a distribuição conforme o
  `superpowers.md` do plugin (que também cobre brainstorming, planejamento,
  review, debugging e a lane claude — método do superpowers, regras do
  Batuta).
```

- [ ] **Step 4: PRD §9 — nova linha no fim da tabela**

```markdown
| Integração com superpowers | Documento central `superpowers.md` na raiz; detecção em runtime, automática, sem toggle; método do superpowers, regras materiais do Batuta (artefatos, routing, verify/commit por item); linha de método condicional em todo brief para executores que tenham superpowers | Skills de processo maduras elevam a regência sem criar dependência: ausente o plugin, cada passo segue o texto baseline da skill; executores externos degradam sozinhos ignorando a condição do brief |
```

- [ ] **Step 5: Verificar consistência**

Run: `grep -c 'superpowers' README.md docs/PRD.md`
Expected: README ≥ 5, PRD ≥ 4 (menções antigas + novas; conferir por leitura que não sobrou referência a `dispatching-parallel-agents` inline no §6.5)

Run: `grep -n 'dispatching-parallel-agents' docs/PRD.md`
Expected: nenhuma ocorrência no §6.5 (a skill agora é citada só via README/`superpowers.md`)

- [ ] **Step 6: Commit**

```bash
git add README.md docs/PRD.md
git commit -m "docs: README e PRD registram a integração com superpowers"
```
