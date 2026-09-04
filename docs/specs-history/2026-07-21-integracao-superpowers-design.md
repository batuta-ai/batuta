# Integração com superpowers — método emprestado, regras do Batuta

**Data:** 2026-07-21 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

O plugin superpowers traz skills de processo maduras (brainstorming,
planejamento, debugging sistemático, review, TDD) que hoje o Batuta ignora —
exceto por uma menção pontual no Step 3 (`dispatching-parallel-agents` e
`using-git-worktrees` no paralelismo). Quando o usuário tem o superpowers
instalado, o maestro deveria conduzir os passos do ciclo com esse método, sem
abrir mão das regras materiais do Batuta.

## Decisões (tomadas em conversa)

1. **Escopo completo** — planejamento, review, debug, brainstorming e execução
   (lane claude + orquestração de batches). Executores externos (codex, kimi)
   continuam como mão de obra: eles não têm superpowers e não são substituídos.
2. **Automático** — detectou superpowers, usa. Sem toggle no profile, sem
   pergunta no `/batuta:init`, sem opt-in por pedido. Mesmo padrão do
   precedente atual do Step 3.
3. **Batuta manda** — superpowers fornece o *método* (perguntas, rigor,
   checklists); Batuta fornece as *regras materiais*: artefatos em `.batuta/`
   e `WORK.md`, implementadores vêm do routing table, verify/commit por item.
   Conflito → regra do Batuta prevalece.
4. **Documento central** — a integração vive em um arquivo só,
   `superpowers.md` na raiz do plugin (ao lado de `routing.md`), no padrão
   dormante dos adapters: os pontos de contato nas skills apontam para ele em
   uma linha; o detalhe só carrega quando é preciso.

## Desenho

### `superpowers.md` (novo arquivo, raiz do plugin)

Abre com as duas regras universais, escritas uma vez só:

- **Detecção:** em runtime, no momento de conduzir o passo — o superpowers
  está instalado se as skills `superpowers:*` aparecem na lista de skills
  disponíveis da sessão. Sem dependência rígida: ausente → o passo segue
  exatamente como o texto da skill descreve (o comportamento atual é o
  baseline de degradação).
- **Autoridade:** quando uma skill do superpowers mandar escrever em
  `docs/superpowers/`, usar subagentes Claude como implementadores, ou pular
  o Step 4/5, a regra do Batuta prevalece.

Em seguida, o mapa momento → skill → adaptação:

| Momento do ciclo | Skill do superpowers | O que o Batuta mantém |
|---|---|---|
| Pedido ambíguo/criativo (Step 1) | `brainstorming` | O design resultante vira input do brief ou do plano; artefato em `.batuta/`, não em `docs/superpowers/` |
| `/batuta:plan` | `writing-plans` (método) | Formato e local `.batuta/plan-<slug>.md`; executor previsto por tarefa; aprovação do usuário antes de executar |
| Orquestração de batch (Steps 1.5/3) | `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees` | Cada "subagent" é um executor externo do routing; verify/commit por item, nunca em lote |
| Verificação (Step 4) e `/batuta:review` | `requesting-code-review`, `verification-before-completion` | Critérios do brief, teste de rastreabilidade, retry/escalação e veredicto do Batuta |
| Bugfix crítico ou falha pós-escalação | `systematic-debugging` | Achados alimentam o re-brief; a escalação segue o routing table |
| Lane claude (tarefas críticas) | `test-driven-development`, `verification-before-completion` | Commit atômico e registro no `WORK.md` do Step 5 |

**Método no brief (executores externos):** codex e opencode também podem ter
o superpowers instalado no lado deles — mas o Batuta não enxerga o ambiente do
executor. A solução é a instrução condicional dentro do brief: todo brief de
código ganha uma linha de método — "se as skills do superpowers estiverem
disponíveis no seu ambiente, conduza por elas (`test-driven-development` para
implementação; `systematic-debugging` para investigação de bug); caso
contrário, trabalhe test-first pelos critérios de aceite". Degrada sozinha:
executor sem superpowers ignora a condição e segue o baseline. Nenhuma
detecção, nenhuma configuração por executor.

Cada linha da tabela ganha um parágrafo curto de adaptação — por exemplo: em
`/batuta:plan`, a decomposição e a análise de dependências seguem o método de
`writing-plans`, mas o artefato final é `.batuta/plan-<slug>.md` no formato
existente; em batch, `subagent-driven-development` conduz a distribuição e a
coleta, mas quem implementa é o executor da lane roteada.

### Pontos de contato (edições de uma linha cada)

- `skills/batuta/SKILL.md`:
  - Step 1 — pedido ambíguo: conduzir o esclarecimento pelo método de
    `brainstorming` quando instalado (o inline planning continua sem artefato).
  - Step 3 — o parágrafo de paralelismo, que hoje cita duas skills inline,
    passa a apontar para `superpowers.md`; a lane claude (crítico) conduz
    pela linha de TDD da tabela.
  - Step 4 — verificação conduz pelo checklist de review; falha que vira
    investigação (retry/escalação de bugfix) conduz por `systematic-debugging`.
  - Step 2 — o brief ganha a linha de método condicional (ver "Método no
    brief" em `superpowers.md`).
- `skills/plan/SKILL.md` — método de `writing-plans`, artefato do Batuta.
- `skills/review/SKILL.md` — checklist de `requesting-code-review` /
  `verification-before-completion` sobre os passos existentes.

### Documentação

- README (PT-BR): subseção curta "Integração com superpowers" descrevendo o
  princípio (método emprestado, regras do Batuta, automático, degrada para o
  comportamento padrão sem o plugin).
- PRD: decisão registrada na tabela do §9 e menção na seção do ciclo que
  couber, mantendo a consistência cruzada PT-BR (README, PRD) × EN (skills).

## Fora de escopo

- Nenhuma mudança no `/batuta:init` (integração automática, sem toggle).
- Nenhuma mudança nos adapters ou no routing table.
- Nenhum comportamento novo quando o superpowers está ausente — o texto atual
  das skills é o baseline e permanece válido palavra por palavra.
- Nenhuma substituição de executores externos por subagentes Claude.

## Critérios de aceite

1. `superpowers.md` existe na raiz do plugin com as duas regras universais e
   as seis linhas do mapa, cada uma com seu parágrafo de adaptação.
2. Todos os pontos de contato listados apontam para `superpowers.md` em uma
   linha; a menção inline antiga do Step 3 foi substituída pelo ponteiro.
3. Com o superpowers ausente, nenhuma skill muda de comportamento (leitura dos
   textos confirma que os ponteiros são condicionais).
4. README e PRD registram a integração de forma consistente com as skills.
5. O template de brief do Step 2 inclui a linha de método condicional para o
   executor externo, com degradação explícita (sem superpowers → test-first
   pelos critérios de aceite).
