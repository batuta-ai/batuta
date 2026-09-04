# Integração com o plugin codex — músculo emprestado, regras do Batuta

**Data:** 2026-07-26 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

O codex CLI já é executor do Batuta (`adapters/codex.md`, lanes Medium e
Complex via `codex exec`). O plugin
[codex-plugin-cc](https://github.com/openai/codex-plugin-cc), quando instalado
no Claude Code do usuário, traz capacidades que o `codex exec` cru não tem:

- **Runtime compartilhado** — um processo Codex persistente iniciado sob
  demanda, que evita o cold start de cada invocação e melhora o tratamento de
  resultado.
- **Subagente `codex:rescue`** — investigação de causa raiz e segunda opinião,
  pensado para quando o trabalho empaca.
- **Skills de apoio** — `codex:codex-cli-runtime` e
  `codex:codex-result-handling` (como falar com o runtime e interpretar o que
  volta) e `codex:gpt-5-4-prompting` (como redigir prompts que os modelos GPT
  seguem melhor).
- **Review sob demanda** — o plugin sabe conduzir um review de código pelo
  Codex.

Hoje o Batuta ignora tudo isso. Quando o plugin está presente, o maestro
deveria usá-lo — sem criar dependência rígida e sem quebrar o ciclo de quem
não o tem.

## Decisões (tomadas em conversa)

1. **Escopo completo, quatro papéis** — o plugin entra como (a) transporte de
   delegação para a rota codex, (b) diagnóstico pré-escalação, (c) review
   cruzado e (d) método de redação de briefs destinados ao codex.
2. **Automático** — detectou o plugin, usa. Sem toggle no profile, sem
   pergunta no `/batuta:init`. Mesmo padrão da integração superpowers.
3. **Review cruzado só em complex/critical** — automático apenas nos itens
   dessas lanes; nas demais, sob demanda (pedido do usuário ou
   `/batuta:review`). Trivial e medium continuam rápidos e baratos.
4. **Rescue antes de escalar** — quando o retry do Step 4 falha, o Codex
   diagnostica e o achado enriquece o re-brief da escalação. A escada de
   roteamento não muda.
5. **Documento central dormante** — a integração vive em `codex-plugin.md` na
   raiz do plugin (ao lado de `routing.md` e `superpowers.md`), no padrão
   dormante: as skills apontam para ele em uma linha; o detalhe só carrega
   quando um ponteiro dispara.
6. **Batuta manda** — o plugin fornece *músculo e método* (runtime, diagnóstico,
   olhar de revisor, dicas de prompting); Batuta fornece as *regras materiais*:
   roteamento e modelo da linha, brief autossuficiente, verify/commit por item,
   artefatos em `.batuta/` e `WORK.md`. Conflito → regra do Batuta prevalece.
   Em particular, o review gate do plugin (stop-time) não participa do ciclo —
   é uma escolha do usuário fora do Batuta.

## Desenho

### `codex-plugin.md` (novo arquivo, raiz do plugin)

Abre com as regras universais, escritas uma vez só:

- **Detecção:** em runtime, no momento de conduzir o passo — o plugin está
  instalado se as skills `codex:*` aparecem na lista de skills disponíveis da
  sessão. Sem dependência rígida: ausente → o passo segue exatamente como o
  texto da skill descreve. O texto baseline das skills É o caminho de
  degradação; este arquivo muda *como* um passo é conduzido, nunca *o que*
  ele entrega.
- **Autoridade:** o plugin nunca decide roteamento, nunca comete, nunca dá o
  veredicto do Step 4 — opina, diagnostica e transporta; o maestro decide.
  O modelo da linha de roteamento continua obrigatório na invocação.
- **Disponibilidade em dois níveis:** o plugin presente não dispensa a
  checagem do executor (`command -v codex`, `codex login status`,
  `adapters/codex.md`) — plugin instalado com CLI ausente/deslogado segue a
  regra de indisponibilidade do routing (uma linha acima).

Em seguida, o mapa momento → capacidade → adaptação:

| Momento do ciclo | Capacidade do plugin | O que o Batuta mantém |
|---|---|---|
| Brief para a rota codex (Step 2) | `gpt-5-4-prompting` (método de redação) | Estrutura do brief (Goal/Context/Conventions/Criteria/Boundaries), linha de método do superpowers, autossuficiência |
| Delegação na rota codex (Step 3) | Runtime compartilhado (`codex-cli-runtime`, `codex-result-handling`) | Modelo e reasoning da linha de roteamento; sandbox/worktree do ciclo; sem plugin → `codex exec` do adapter |
| Retry falhou, antes de escalar (Step 4) | `codex:rescue` (diagnóstico de causa raiz) | A escada de escalação (uma linha acima); o achado só enriquece o re-brief |
| Verificação de item complex/critical (Step 4) e `/batuta:review` | Review pelo Codex (segunda opinião) | Critérios do brief, teste de rastreabilidade, veredicto do maestro |

### Adaptação por momento

- **Brief (Step 2):** ao redigir um brief cuja rota é codex, consultar
  `gpt-5-4-prompting` e aplicar suas recomendações à redação. A estrutura e o
  conteúdo do brief continuam os do Step 2 — o plugin melhora a *forma*, não
  muda o *contrato*. Rota não-codex → brief como hoje, sem consultar nada.
- **Delegação (Step 3):** rota codex + plugin presente → invocar via runtime
  compartilhado do plugin, conforme suas skills de runtime, carregando o
  modelo e o reasoning da linha de roteamento (a mesma regra do adapter: sem
  os flags da linha, é bug de roteamento). Worktree e paralelismo do ciclo
  aplicam-se igual — o runtime é transporte, não muda onde o executor
  trabalha. Sem plugin → `codex exec` conforme `adapters/codex.md`, como
  hoje. A invocação de research do scout (lane Research apontando para codex)
  também pode usar o runtime, mantendo o modo read-only e o guard universal.
- **Rescue (Step 4):** item falhou a verificação e o retry também → antes de
  escalar, despachar `codex:rescue` com o brief, o diff da tentativa e o
  feedback da falha; o diagnóstico entra na seção Context do re-brief da
  escalação. O rescue não implementa o conserto — quem implementa é o executor
  da linha de cima, pelo ciclo normal. Rescue indisponível ou inconclusivo →
  escalar como hoje, sem diagnóstico. Com superpowers instalado,
  `systematic-debugging` continua conduzindo a investigação de bugfixes
  críticos e falhas pós-escalação (`superpowers.md`); o rescue é o degrau
  anterior, mais barato, na primeira escalação.
- **Review cruzado (Step 4 / `/batuta:review`):** em itens classificados
  complex ou critical, após o diff review do maestro e antes do veredicto,
  pedir ao plugin um review do diff do item. Achados procedentes → tratados
  como falha de verificação normal (retry com feedback). Nas lanes trivial e
  medium, nunca automático: só quando o usuário pedir ou dentro do
  `/batuta:review`. O veredicto é sempre do maestro — o Codex opina, Batuta
  decide. Review cruzado indisponível → o Step 4 vale sozinho, como hoje.

### Pontos de contato nas skills (ponteiros de uma linha)

- `skills/batuta/SKILL.md` Step 2 — junto da linha de método: brief para rota
  codex, com o plugin instalado → redigir conforme `codex-plugin.md`.
- `skills/batuta/SKILL.md` Step 3 — na invocação do executor: rota codex, com
  o plugin instalado → transporte conforme `codex-plugin.md`.
- `skills/batuta/SKILL.md` Step 4 — no parágrafo de falha/escalação: retry
  falhou, com o plugin instalado → diagnóstico pré-escalação conforme
  `codex-plugin.md`; e no corpo do passo: item complex/critical → review
  cruzado conforme `codex-plugin.md`.
- `skills/review/SKILL.md` — com o plugin instalado, incluir o review do
  Codex como segunda opinião, conforme `codex-plugin.md`.
- `adapters/codex.md` — uma seção curta "Plugin transport": com o plugin
  instalado, a invocação preferida é via runtime compartilhado
  (`codex-plugin.md`); o `codex exec` documentado segue sendo o baseline.

Nenhum outro arquivo muda. `routing.md` não muda: o plugin não é uma lane,
é um meio.

### O que fica de fora (YAGNI)

- **Review gate do plugin** (stop-time) — escolha do usuário, fora do ciclo.
- **Toggle no profile / pergunta no init** — integração é automática; se o
  uso real pedir controle, vira linha de profile depois.
- **`codex:rescue` como executor de código** — rescue diagnostica; quem
  implementa é a lane do routing. Roteamento de implementação para o plugin
  além da rota codex existente não existe.
- **Detecção do plugin no lado do executor** — irrelevante: o plugin é do
  Claude Code do maestro; o executor codex continua recebendo a linha de
  método do superpowers no brief, como hoje.

## Documentação

- `README.md` — menção curta na seção de integrações (ao lado do
  superpowers): com o plugin codex instalado, o Batuta o usa como transporte,
  diagnóstico e review cruzado; link para `codex-plugin.md`.
- `docs/PRD.md` — parágrafo na arquitetura (integrações) e linha na tabela de
  decisões de design: plugin codex = músculo emprestado, mesmo contrato de
  autoridade do superpowers.

## Critérios de aceite

1. `codex-plugin.md` existe na raiz, com detecção, autoridade, os dois níveis
   de disponibilidade, o mapa de quatro momentos e a adaptação por momento.
2. Os cinco pontos de contato (Steps 2/3/4 do ciclo, `skills/review/SKILL.md`,
   `adapters/codex.md`) apontam para `codex-plugin.md` em uma linha cada, sem
   duplicar o conteúdo do arquivo central.
3. Sem o plugin instalado, nenhum comportamento muda: os textos baseline das
   skills permanecem completos e autossuficientes.
4. Review cruzado descrito como automático apenas em complex/critical;
   trivial/medium só sob demanda.
5. Rescue descrito como pré-escalação: diagnóstico alimenta o re-brief; a
   escada de roteamento permanece intacta.
6. README e PRD documentam a integração nos moldes acima.
