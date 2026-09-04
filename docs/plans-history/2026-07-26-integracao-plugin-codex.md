# Integração com o plugin codex — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando o plugin codex (codex-plugin-cc) está instalado no Claude Code do maestro, o Batuta o usa como método de redação de brief, transporte de delegação, diagnóstico pré-escalação e review cruzado — mantendo roteamento, veredicto e commits sob as regras do Batuta.

**Architecture:** Um documento central dormante (`codex-plugin.md` na raiz do plugin, mesmo padrão do `superpowers.md`) concentra detecção, autoridade, os dois níveis de disponibilidade e o mapa momento→capacidade→adaptação. As skills (`batuta`, `review`) e o `adapters/codex.md` ganham ponteiros de uma linha. README e PRD registram a decisão.

**Tech Stack:** Plugin Claude Code — arquivos Markdown apenas; verificação por leitura e `grep`. Não há suite de testes: os passos de verificação são greps com saída esperada.

**Spec:** `docs/superpowers/specs/2026-07-26-integracao-plugin-codex-design.md`

## Global Constraints

- Idiomas (PRD §9): instruções para ferramentas (skills, `codex-plugin.md`, adapters) em **inglês**; docs de usuário (README, PRD) em **PT-BR**.
- Com o plugin ausente, nenhuma skill muda de comportamento — todo ponteiro é condicional ("with the codex plugin installed…"); o texto atual é o baseline de degradação e permanece válido.
- Integração automática: nenhuma mudança em `skills/init/SKILL.md` ou `routing.md` — o plugin é meio, não lane.
- Batuta manda: o plugin nunca decide roteamento, nunca comete, nunca dá o veredicto do Step 4; o modelo da linha de roteamento continua obrigatório na invocação.
- Review cruzado automático só em complex/critical; rescue só como diagnóstico pré-escalação.
- Um task verificado = um commit (mensagens em PT-BR, prefixos `feat:`/`docs:` como no histórico recente do repo).

---

### Task 1: Criar `codex-plugin.md` na raiz do plugin

**Files:**
- Create: `codex-plugin.md` (raiz do repo, ao lado de `routing.md` e `superpowers.md`)

**Interfaces:**
- Produces: as âncoras que os ponteiros das Tasks 2–3 citam — as linhas do mapa ("brief row", "delegation row", "rescue row", "cross-review row").

- [ ] **Step 1: Escrever o arquivo com este conteúdo exato**

````markdown
# Codex plugin integration — borrowed muscle, Batuta's rules

How the maestro conducts the cycle when the
[codex companion plugin](https://github.com/openai/codex-plugin-cc) is
installed in Claude Code. Dormant like the adapters: skills point here in
one line; read this file only when a pointer fires.

## Universal rules

- **Detection:** at runtime, at the moment of conducting the step — the
  plugin is installed when `codex:*` skills appear in the session's
  available skills. No hard dependency: absent → the step runs exactly as
  the skill's own text describes. The skills' baseline text IS the
  degradation path; this file only changes *how* a step is conducted,
  never *what* it delivers.
- **Authority:** the plugin supplies *muscle* — transport, diagnosis, a
  second reviewer's eyes, prompt-writing method. Batuta supplies the
  rules: the plugin never decides routing, never commits, never issues
  the Step 4 verdict. The routing row's model and reasoning flags remain
  mandatory on every invocation.
- **Two-level availability:** the plugin being installed does not replace
  the executor check (`adapters/codex.md`: `command -v codex`,
  `codex login status`). Plugin present with the CLI missing or logged
  out → the codex lane is unavailable and routing's rule applies (one
  row up). The plugin's stop-time review gate is the user's own setting —
  it never participates in the cycle.

## Map — cycle moment → plugin capability → what Batuta keeps

| Cycle moment | Plugin capability | What Batuta keeps |
| --- | --- | --- |
| Brief for the codex lane (Step 2) | `gpt-5-4-prompting` (writing method) | brief structure (Goal/Context/Conventions/Criteria/Boundaries), the superpowers method line, self-sufficiency |
| Delegation on the codex lane (Step 3) | shared runtime (`codex-cli-runtime`, `codex-result-handling`) | the routing row's model and reasoning flags; the cycle's worktree and sandbox; without the plugin → `codex exec` per the adapter |
| Failed retry, before escalating (Step 4) | `codex:rescue` (root-cause diagnosis) | the escalation ladder (one row up); the diagnosis only enriches the re-brief |
| Verifying a complex/critical item (Step 4) and `/batuta:review` | Codex review (second opinion) | the brief's criteria, the traceability test, the maestro's verdict |

### Adaptation per moment

- **Brief (Step 2):** when the routed lane is codex, consult
  `gpt-5-4-prompting` and apply its advice to the brief's wording. The
  plugin improves the *form*; the Step 2 contract (structure, content,
  self-sufficiency, method line) is unchanged. Non-codex lanes → brief as
  the skill describes, nothing consulted.
- **Delegation (Step 3):** codex lane + plugin present → invoke through
  the plugin's shared runtime, per its runtime skills, carrying the
  routing row's model and reasoning (same rule as the adapter: an
  invocation without the row's flags is a routing bug). The cycle's
  worktree and parallelism apply unchanged — the runtime is transport; it
  does not change where the executor works. The scout's research
  invocation may also use the runtime when its lane points at codex,
  keeping read-only mode and the universal guard. Without the plugin →
  `codex exec` per `adapters/codex.md`.
- **Rescue (Step 4):** the item failed verification and the retry failed
  too → before escalating, dispatch `codex:rescue` with the brief, the
  attempt's diff and the failure feedback; its diagnosis goes into the
  Context section of the escalation's re-brief. The rescue never
  implements the fix — the next row's executor does, through the normal
  cycle. Rescue unavailable or inconclusive → escalate as the skill
  describes, without a diagnosis. With superpowers installed,
  `systematic-debugging` still conducts critical-bugfix and
  post-escalation investigation (`superpowers.md`); the rescue is the
  earlier, cheaper rung at the first escalation.
- **Cross-review (Step 4 / `/batuta:review`):** on items classified
  complex or critical, after the maestro's diff review and before the
  verdict, request a Codex review of the item's diff. Valid findings are
  treated as a normal verification failure (retry with feedback). On
  trivial and medium items, never automatic — only when the user asks or
  inside `/batuta:review`. Cross-review unavailable → Step 4 stands on
  its own. The verdict is always the maestro's.
````

- [ ] **Step 2: Verificar estrutura**

Run: `grep -c '^| ' codex-plugin.md && grep -c 'row' codex-plugin.md`
Expected: `6` (2 linhas de cabeçalho + 4 do mapa) e ≥ 6 (as âncoras "… row" que os ponteiros citam)

- [ ] **Step 3: Commit**

```bash
git add codex-plugin.md
git commit -m "feat: codex-plugin.md — integração central (músculo emprestado, regras do Batuta)"
```

---

### Task 2: Ponteiros no ciclo (`skills/batuta/SKILL.md`)

**Files:**
- Modify: `skills/batuta/SKILL.md` (Steps 2, 3 e 4)

**Interfaces:**
- Consumes: âncoras da Task 1 (`codex-plugin.md`: "brief row", "delegation row", "rescue row", "cross-review row").

- [ ] **Step 1: Step 2 — redação de brief para a rota codex**

Localizar o parágrafo:

```markdown
**Method line:** every code brief also carries the conditional method line
from `superpowers.md` ("Method in the brief") — the executor may have
superpowers on its side; without it the line degrades to test-first by the
acceptance criteria.
```

Adicionar logo após, como parágrafo próprio:

```markdown
**Codex brief (plugin):** when the routed lane is codex and the codex
plugin is installed, write the brief per `codex-plugin.md` (brief row) —
the structure above is unchanged.
```

- [ ] **Step 2: Step 3 — transporte via runtime compartilhado**

Localizar o fim do primeiro parágrafo do Step 3:

```markdown
When a routing row names a model, the
invocation must carry it — a delegation without the row's model flags is a
routing bug, not a shortcut.
```

Adicionar logo após, na sequência do mesmo parágrafo:

```markdown
With the codex plugin installed, a
codex-lane delegation goes through the plugin's shared runtime instead of
raw `codex exec` (`codex-plugin.md`, delegation row) — the row's model
flags still apply.
```

- [ ] **Step 3: Step 4 — review cruzado em complex/critical**

Localizar o item 3 da lista do Step 4:

```markdown
3. **Acceptance criteria** — check them one by one against the brief.
```

Adicionar logo após, como parágrafo próprio (antes do parágrafo "**In a worktree**"):

```markdown
**Cross-review (complex/critical):** with the codex plugin installed, an
item classified complex or critical also gets a Codex review of its diff
before the verdict (`codex-plugin.md`, cross-review row); valid findings
count as a verification failure. Other lanes: only on user demand or via
`/batuta:review`.
```

- [ ] **Step 4: Step 4 — diagnóstico pré-escalação**

Localizar:

```markdown
Failed → send the diff + specific feedback back to the executor and allow
**1 retry**. Failed again → **escalate**: the task moves one row up the routing
table and the cycle restarts at Step 2 (brief enriched with what was learned).
```

Adicionar logo após a frase "(brief enriched with what was learned).", na sequência do mesmo parágrafo:

```markdown
With the codex plugin installed, that enrichment comes from a
`codex:rescue` diagnosis dispatched before escalating (`codex-plugin.md`,
rescue row).
```

- [ ] **Step 5: Verificar**

Run: `grep -c 'codex-plugin.md' skills/batuta/SKILL.md`
Expected: `4` (Steps 2, 3, 4×2)

- [ ] **Step 6: Commit**

```bash
git add skills/batuta/SKILL.md
git commit -m "feat: ciclo aponta para codex-plugin.md nos Steps 2–4"
```

---

### Task 3: Ponteiro em `review` e seção no adapter

**Files:**
- Modify: `skills/review/SKILL.md`
- Modify: `adapters/codex.md`

**Interfaces:**
- Consumes: âncoras da Task 1 ("cross-review row" e o próprio `codex-plugin.md`).

- [ ] **Step 1: `skills/review/SKILL.md`**

Localizar o parágrafo:

```markdown
With superpowers installed, conduct the review with the rigor of
`requesting-code-review` and `verification-before-completion`
(plugin root `superpowers.md`, verification row); the steps and the verdict
below stay unchanged.
```

Adicionar logo após, como parágrafo próprio:

```markdown
With the codex plugin installed, also request a Codex second-opinion
review of the diff (`codex-plugin.md`, cross-review row); the verdict
below stays the maestro's.
```

- [ ] **Step 2: `adapters/codex.md` — seção "Plugin transport"**

Localizar o título:

```markdown
## Availability check
```

Adicionar antes dele, como seção própria:

```markdown
## Plugin transport

When the codex companion plugin is installed in the maestro's Claude Code
(`codex:*` skills present in the session), delegation goes through the
plugin's shared runtime instead of the raw `codex exec` commands above —
see `codex-plugin.md` at the plugin root. Everything else in this adapter
(model selection, context passing, capabilities, cost, availability)
applies unchanged; the commands above remain the baseline without the
plugin.

```

- [ ] **Step 3: Verificar**

Run: `grep -c 'codex-plugin.md' skills/review/SKILL.md adapters/codex.md`
Expected: `skills/review/SKILL.md:1` e `adapters/codex.md:1`

- [ ] **Step 4: Commit**

```bash
git add skills/review/SKILL.md adapters/codex.md
git commit -m "feat: review e adapter codex apontam para codex-plugin.md"
```

---

### Task 4: Documentação (README + PRD)

**Files:**
- Modify: `README.md` (nova seção após "## Integração com superpowers", antes de "## Adicionando um executor novo")
- Modify: `docs/PRD.md` (§5.1 árvore, fim do §6.2, §9 tabela)

**Interfaces:**
- Consumes: nomes e princípios da Task 1 (consistência PT-BR × EN).

- [ ] **Step 1: README — nova seção após o parágrafo final de "## Integração com superpowers"**

Localizar o fim da seção (a frase "…O mapa completo vive em `superpowers.md` na raiz do plugin.") e adicionar após ela:

```markdown
## Integração com o plugin codex

Se você tem o [plugin do Codex](https://github.com/openai/codex-plugin-cc)
instalado no Claude Code, o Batuta o usa em quatro momentos: redige os
briefs da rota codex com o método de prompting do plugin, delega pelo
runtime compartilhado (sem cold start do CLI), pede um diagnóstico ao
`codex:rescue` antes de escalar um item que falhou e coleta um review
cruzado do Codex em itens complex/critical antes do veredicto. O músculo é
do plugin; as regras são do Batuta: roteamento, modelo da linha, veredicto
e commit continuam do maestro. Tudo automático e sem dependência: sem o
plugin, cada passo segue exatamente como descrito acima — e o plugin
instalado não dispensa o `codex` CLI logado. O mapa completo vive em
`codex-plugin.md` na raiz do plugin.
```

- [ ] **Step 2: PRD §5.1 — adicionar à árvore, após a linha de `superpowers.md`**

```
├── codex-plugin.md        # integração com o plugin codex: músculo emprestado, regras do Batuta
```

- [ ] **Step 3: PRD — parágrafo no fim do §6.2 (antes de "### 6.3")**

```markdown
**Plugin codex como meio, não lane:** com o plugin do Codex instalado no
Claude Code do maestro, a rota codex é invocada pelo runtime compartilhado
do plugin, os briefs dessa rota seguem o método de prompting dele, um item
que falhou o retry recebe diagnóstico do `codex:rescue` antes da escalada
e itens complex/critical ganham review cruzado antes do veredicto. Nada
muda na tabela de roteamento: detecção em runtime, degradação para
`codex exec` cru, e a checagem de disponibilidade do CLI continua valendo
(plugin sem CLI logado = lane indisponível). Mapa completo em
`codex-plugin.md` na raiz.
```

- [ ] **Step 4: PRD §9 — nova linha no fim da tabela**

```markdown
| Integração com o plugin codex | Documento central `codex-plugin.md` na raiz; detecção em runtime, automática, sem toggle; quatro papéis: método de prompting no brief, transporte via runtime compartilhado, diagnóstico `codex:rescue` pré-escalação, review cruzado automático só em complex/critical; plugin nunca decide roteamento nem veredicto | Mesmo contrato de autoridade do superpowers: músculo emprestado eleva a rota codex sem criar dependência — ausente o plugin, o ciclo degrada para o `codex exec` do adapter; review cruzado restrito às lanes caras preserva trivial/medium rápidos |
```

- [ ] **Step 5: Verificar consistência**

Run: `grep -c 'codex-plugin.md' README.md docs/PRD.md`
Expected: `README.md:1` e `docs/PRD.md:3` (árvore §5.1, §6.2, §9)

Run: `grep -n 'plugin do Codex' README.md docs/PRD.md`
Expected: 1 ocorrência no README e 1 no PRD (§6.2)

- [ ] **Step 6: Commit**

```bash
git add README.md docs/PRD.md
git commit -m "docs: README e PRD registram a integração com o plugin codex"
```
