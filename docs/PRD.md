# PRD — Batuta

> *Quem rege não toca.*

**Data:** 2026-07-19
**Status:** Rascunho aprovado em design — pré-implementação
**Formato:** Plugin Claude Code, open source (MIT)

## 1. Visão

Batuta é um framework leve de orquestração para Claude Code. O Claude atua como
**maestro**: classifica cada tarefa, escolhe o executor mais barato que dá conta,
monta o contexto, delega, verifica o resultado e commita. Os executores — CLIs de
código como codex, opencode (com Kimi, DeepSeek etc.) e o próprio Claude — são os
instrumentistas.

O objetivo é substituir frameworks pesados de processo (fases, cadeias de agentes,
artefatos obrigatórios) por um ciclo único e enxuto que preserva as garantias que
importam: rastreabilidade via git, estado retomável, planejamento quando necessário
e verificação sempre.

O v1 é focado no Claude Code como orquestrador, mas o papel de maestro é uma
posição na arquitetura, não uma dependência: a direção do projeto é permitir
configurar qualquer ferramenta como orquestrador no futuro. Decisões de design
que acoplem o ciclo (brief → delegar → verificar → commitar) ao Claude devem ser
evitadas quando houver alternativa de custo equivalente.

## 2. Problema

Frameworks de orquestração existentes (ex.: GSD) entregam disciplina ao custo de:

1. **Peso de processo** — fases, dezenas de agentes e artefatos obrigatórios mesmo
   para tarefas pequenas.
2. **Custo de tokens** — planner, checker, verifier e executor rodando todos no
   modelo mais caro.
3. **Fricção de manutenção** — estado em tabelas com schema rígido que quebram com
   um pipe não escapado; validações que travam o fluxo.

Ao mesmo tempo, o usuário tem múltiplas fontes de computação com custos distintos
(assinatura Claude, assinatura ChatGPT/codex, APIs pay-per-use) e nenhuma forma
estruturada de equilibrá-las.

## 3. Princípios

1. **Quem rege não toca** — o orquestrador gasta tokens dirigindo, não escrevendo
   código. Código é escrito pelo executor mais barato capaz.
2. **O processo pesa o mínimo que a tarefa permitir** — planejamento é adaptativo,
   nunca pré-requisito.
3. **Estado é prosa, não schema** — checkboxes e texto livre; nada que quebre com
   um caractere.
4. **Toda entrega passa por verificação** — diff review, testes e critérios de
   aceite, sempre.
5. **Extensível por arquivo, não por código** — adicionar um executor é copiar um
   template de adapter e preencher.

## 4. Garantias preservadas (herança consciente)

| Garantia | Como o Batuta entrega |
|---|---|
| Commits atômicos | Uma tarefa verificada = um commit; possibilita undo limpo |
| Estado persistente | `WORK.md` único por projeto, formato prosa + checkboxes |
| Plano antes de executar | Adaptativo: inline por default, formal via `/batuta:plan` |
| Verificação pós-execução | Etapa fixa do ciclo: diff + testes + critérios de aceite |

## 5. Arquitetura

### 5.1 Estrutura do plugin

```
batuta/
├── .claude-plugin/plugin.json
├── skills/
│   ├── batuta/            # entrada principal — o ciclo: classifica, roteia, delega, verifica
│   ├── init/              # onboarding (1ª vez) e reconfiguração
│   ├── plan/              # planejamento formal opcional
│   ├── pause/             # pausa com handoff de sessão
│   ├── resume/            # retomada consumindo o handoff
│   ├── status/            # exibe WORK.md e tarefas em andamento
│   ├── route/             # exibe/edita as tabelas de roteamento
│   └── review/            # re-executa a verificação sobre qualquer diff
├── routing.md             # tabela de roteamento default (editável)
├── superpowers.md         # integração com superpowers: método emprestado, regras do Batuta
├── adapters/
│   ├── codex.md           # invocação não-interativa, passagem de contexto, limites
│   ├── opencode.md        # idem, com modelo configurável (Kimi, DeepSeek, ...)
│   ├── claude.md          # o próprio orquestrador executa
│   └── _template.md       # contrato para novos executores
├── templates/
│   ├── react.md           # convenções e regras de stack para briefs
│   ├── vue.md
│   ├── node-api.md
│   └── generic.md
├── docs/PRD.md
└── README.md
```

### 5.2 Artefatos por projeto (criados pelo Batuta no repo do usuário)

```
<projeto>/
├── WORK.md                # estado leve: em andamento / feito
└── .batuta/
    ├── profile.md         # perfil do projeto (onboarding da primeira execução)
    ├── plan-<slug>.md     # planos formais, quando existirem
    └── worktrees/<slug>/  # worktree transitório por tarefa (modo Worktree; ignorado via .git/info/exclude)
```

## 6. Funcionalidades

### 6.1 Onboarding e reconfiguração (/batuta:init)

O onboarding é o modo primeira-execução do `/batuta:init` (3–5 perguntas).
`/batuta` num projeto sem `.batuta/profile.md` aponta para o init e interrompe — o
ciclo nunca faz onboarding inline:

- **Tipo de projeto / stack** — React, Vue, Node API, outro (com detecção
  automática pelo package.json/composer.json etc. como sugestão default).
- **Metodologia** — TDD ou testes depois; conventional commits ou livre;
  trunk-based ou feature branches.
- **Comando de testes e de build** — para a etapa de verificação.
- **Lotes decompostos** — execução sequencial (default) ou paralela.
- **Worktree e instalação** — modo worktree por tarefa (`off`/`medium+`/`always`,
  default `medium+`) e comando de instalação opcional para o ambiente de
  testes dos worktrees.

O resultado vira `.batuta/profile.md`. O template de stack correspondente
(`templates/react.md` etc.) é referenciado no perfil e suas convenções entram
automaticamente em todo task brief enviado aos executores. O usuário pode editar
o perfil a qualquer momento; `/batuta:init` num projeto já configurado entra
em modo **reconfiguração** — re-checa os executores referenciados pela tabela,
mostra o mapeamento e o perfil atuais e reescreve só o que o usuário pedir
(lane/modelo, respostas do perfil, re-sweep do mapa), sem tocar o `WORK.md`.

O perfil também ganha um **mapa do projeto**: 20–40 linhas em prosa (diretórios-
chave, onde vivem rotas/componentes/testes, pontos de entrada, o que é gerado e
não se toca), preenchidas no onboarding — varredura delegada ao batedor (lane de pesquisa,
§6.9) quando mapeada; o maestro só varre ele mesmo se a lane não existir ou o
batedor falhar duas vezes.
A manutenção é oportunista: se ao montar um brief o maestro descobrir algo que o
mapa não tinha, acrescenta uma linha; nunca existe uma "fase de atualizar o
mapa". Se o projeto tem `CLAUDE.md`/`AGENTS.md`, o perfil complementa sem
duplicar; contradição entre esses arquivos e o perfil é sinalizada ao usuário,
nunca editada — executores como o codex leem `AGENTS.md` por conta própria, e
uma contradição não sinalizada vira instrução conflitante no meio da tarefa.

**Takeover de outro framework:** se o onboarding detectar artefatos de outro
framework (`.planning/`, `TODO.md`, roadmaps), oferece importação única — o que
estava em andamento/feito vira linhas no `WORK.md`, trabalho restante grande
vira `.batuta/plan-<slug>.md`, decisões relevantes viram linhas no perfil. Os
artefatos antigos ficam intocados.

**Checagem de executores e mapeamento de lanes:** o onboarding roda as
verificações de disponibilidade dos adapters, mostra o que encontrou e propõe o
mapeamento das lanes a partir do setup real — a palavra final é do usuário, que
escolhe qual CLI/provider/modelo assume cada lane. Trio completo → tabela
default, confirmando o modelo barato da trivial (opencode) e o executor da
complexa — codex + modelo forte (default) ou modelo Claude forte via instância
background, à preferência do usuário. Sem codex → opencode cobre trivial/média,
complexa vai para Claude forte em background, crítica fica com a sessão. Só
claude → lanes se diferenciam por modelo Claude via instância background
(`claude -p --model …`). A mesma proposta cobre a lane de apoio de pesquisa (§6.9): candidato barato
vindo da mesma descoberta (filtro kimi/haiku/mini/nano/flash).
Tudo numa única pergunta de confirmação; o
resultado vira o `.batuta/routing.md` do projeto — a cópia local nasce no
onboarding com executores e modelos explícitos. Executor ausente é informado na
hora, junto com o colapso de lanes, em vez de descoberto na primeira delegação.

### 6.2 Roteamento por complexidade

Tabela default (editável via `routing.md` do projeto ou `/batuta:route`):

| Complexidade | Exemplos | Executor | Custo |
|---|---|---|---|
| Trivial | rename, config, texto, teste unitário simples | opencode + modelo barato | centavos (API) |
| Média | feature isolada, bugfix com reprodução clara | codex (modelo default) | assinatura ChatGPT |
| Complexa | multi-arquivo especificável num brief preciso | codex + modelo forte, reasoning alto | assinatura ChatGPT |
| Crítica | arquitetura, segurança, contexto da conversa indispensável | claude (orquestrador executa) | assinatura Claude |

- O orquestrador classifica sozinho e informa a decisão em uma linha
  ("→ codex: bugfix médio"). O usuário pode sobrescrever a qualquer momento
  ("usa kimi pra isso").
- **Escalada automática:** executor falhou na verificação 2× → tarefa sobe um
  nível de executor.
- **Modelo explícito:** em CLIs multi-modelo, a linha da tabela nomeia o modelo;
  o maestro nunca usa o default global do CLI, que pode apontar para um modelo
  caro e derrotar silenciosamente o roteamento de custo. Exceção: codex sob
  assinatura tem custo flat por tarefa — default aceitável na lane média. Na
  lane complexa a exceção não vale: ali o modelo é botão de capacidade, então a
  linha nomeia modelo e reasoning effort explícitos (ex.: `codex -m gpt-5-codex,
  reasoning high`), confirmados no onboarding.
- **Complexa vs Crítica:** a divisa é o brief, não o tamanho. Brief
  autossuficiente possível (arquivos, decisões tomadas, critérios verificáveis)
  → complexa, delegável ao executor da lane com modelo forte. Exige contexto da
  conversa, julgamento de segurança ou decisões em aberto → crítica, fica com o
  claude. Na dúvida, crítica: errar para cima custa a diferença de preço; errar
  para baixo custa um ciclo de delegação falho.
- **Executor da lane complexa é escolha do usuário:** default codex + modelo
  forte, mas o onboarding oferece a alternativa de um modelo Claude forte via
  instância background (`claude -p --model opus "<brief>"`). O limite da
  variante é contexto, não capacidade: a instância background não vê a
  conversa, então só serve para o que passa no teste do brief — o que precisa
  da conversa continua crítico e fica com a sessão, qualquer que seja o dono
  da complexa.

### 6.3 Ciclo de execução (único, sem fases)

Um task é o menor entregável que pode ser verificado e commitado sozinho.
Pedido com mais de um entregável (lista de componentes, escopo plural) é
decomposto antes do brief: cada item percorre o ciclo inteiro abaixo e
termina no próprio commit — sequencial por default; `parallel` opcional via
perfil, com override verbal por tarefa. Itens acoplados que não podem ser
verificados separadamente permanecem um task só, como exceção declarada no
anúncio. Falha de um item (mesmo após escalada) pula o item e bloqueia só os
dependentes; os independentes seguem.

1. **Brief** — orquestrador monta o task brief: objetivo, contexto, arquivos
   relevantes, convenções do perfil/template, critérios de aceite.
2. **Delegar** — invoca o adapter via Bash (`codex exec …`, `opencode run …`).
3. **Verificar** — `git diff` review pelo orquestrador + testes do projeto +
   critérios de aceite do brief.
4. **Commitar** — commit atômico. Falha → 1 retry com feedback ao executor →
   escalada de nível.
5. **Registrar** — uma linha no `WORK.md`.

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

### 6.4 Planejamento adaptativo

- **Inline (default):** diante de tarefa ambígua ou grande, o orquestrador faz
  2–3 perguntas e esboça o plano em texto na conversa. Sem artefato.
- **Formal (`/batuta:plan`):** plano aprovável salvo em `.batuta/plan-<slug>.md`,
  para trabalhos que atravessam sessões.
- Plano nunca é pré-requisito: tarefa clara vai direto ao ciclo.

### 6.5 Paralelismo

Tarefas independentes rodam em paralelo: executores em background
(Bash `run_in_background`), um git worktree por executor quando houver risco de
conflito de arquivos.

- **Com superpowers instalado:** rege a distribuição conforme o
  `superpowers.md` do plugin (que também cobre brainstorming, planejamento,
  review, debugging e a lane claude — método do superpowers, regras do
  Batuta).
- **Sem superpowers:** fallback para background tasks nativos do Claude Code.
- Detecção em runtime; nenhuma dependência rígida.
- Lotes decompostos (§6.3) são sequenciais por default; paralelismo entra
  pela linha Execution do perfil ou por pedido verbal. Mesmo em paralelo,
  verificação e commit são por item.

### 6.6 Estado (`WORK.md`)

```markdown
# WORK — <projeto>

## Em andamento
- [ ] <tarefa> → codex (delegada 2026-07-19)

## Feito
- [x] <tarefa> → kimi (moonshotai/kimi-k2), commit abc123
- [x] <tarefa> → codex (escalou de kimi após 2 falhas), commit def456
```

Formato prosa + checkboxes. Sem tabelas com schema, sem validação estrita.

A linha do Feito conta a história de roteamento completa: executor + modelo e
eventuais retries/escaladas. É o diário de regência do projeto — o
`/batuta:status` agrega sob demanda (tarefas por lane, taxa de escalada, taxa
de delegação); nenhum contador ou métrica é armazenado.

### 6.7 Comandos

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

### 6.8 Contrato de adapter

Cada adapter em `adapters/*.md` define:

- **Invocação:** comando não-interativo exato (ex.: `codex exec --sandbox
  workspace-write "<brief>"`).
- **Passagem de contexto:** como entregar o brief (argumento, arquivo, stdin).
- **Capacidades e limites:** tamanho de tarefa recomendado, o que evitar delegar.
- **Custo:** assinatura ou pay-per-use, para a tabela de roteamento.
- **Verificação de disponibilidade:** como checar se o CLI está instalado/logado.

Novo executor = copiar `_template.md`, preencher, adicionar linha no `routing.md`.

**Adapters dormentes:** a tabela referencia, o adapter dorme. Um adapter só é
lido quando sua linha é roteada (delegação) ou adicionada à tabela
(onboarding/`/batuta:route`) — nunca há varredura de todos os adapters nem de
todas as CLIs da máquina. É isso que mantém o custo de contexto constante
conforme o catálogo cresce: suportar cursor, copilot, kimi CLI etc. é um
arquivo de ~50 linhas que ninguém paga para ter, só para usar. Propriedade
inegociável ao adicionar executores.

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

## 7. Fora de escopo (v1)

- Instalador próprio ou binário — distribuição é via plugin marketplace/git.
- Dashboard, métricas de custo agregadas ou telemetria.
- Fases, milestones, roadmaps e cadeias de agentes especializados.
- Orquestração de CLIs interativos (só modo não-interativo/exec).
- Gestão de credenciais dos executores (cada CLI cuida do próprio login).
- Orquestradores alternativos ao Claude Code — no v1 o maestro é sempre o Claude.
  É direção futura declarada (ver §1); o que o v1 deve garantir é apenas não
  acoplar o ciclo ao Claude de forma que inviabilize a troca depois.

## 8. Critérios de sucesso

1. Tarefa trivial delegada e commitada com < 3 interações do usuário.
2. Custo Claude por tarefa delegada limitado a brief + review (sem geração de
   código pelo orquestrador em tarefas triviais/médias).
3. Adicionar um executor novo sem tocar em nenhuma skill (só adapter + routing).
4. `WORK.md` legível por humano e retomável por sessão nova sem contexto extra.
5. Funciona com e sem superpowers instalado.

## 9. Decisões registradas

| Decisão | Escolha | Motivo |
|---|---|---|
| Formato | Plugin Claude Code | Instalável, versionado, formato que a comunidade consome |
| Orquestrador | Claude Code no v1; agnóstico no futuro | Foco inicial em um maestro só; o papel de orquestrador deve poder ser assumido por qualquer ferramenta configurada |
| Roteamento | Automático com override | Menos fricção; usuário mantém controle verbal |
| Estado | Prosa + checkboxes | Tabelas com schema rígido foram fonte de quebra no GSD |
| Nome | Batuta | Metáfora exata (reger sem tocar), brasileiro, curto, disponível |
| Comandos | 5 (go, plan, status, route, review) | Superfície mínima com controle de custo e verificação manual |
| Onboarding | Automático na 1ª execução | Perfil de stack/metodologia alimenta briefs sem comando extra |
| Mapa de código | Seção curta em prosa no `profile.md`, atualizada oportunisticamente | Mapa formal envelhece e vira referência errada; o custo real é redescobrir onde as coisas ficam, e isso um mapa de 20–40 linhas resolve |
| Takeover de outro framework | Importação única no onboarding (estado → `WORK.md`/plan/perfil) | O que precisa de tradução é o estado do trabalho, não a arquitetura; artefatos antigos ficam intocados |
| Fronteira de escrita | Batuta escreve só em `WORK.md`, `.batuta/` e no código via ciclo | Confiança e mudança cirúrgica: `CLAUDE.md`, `AGENTS.md` e configs de outras ferramentas são somente leitura, salvo pedido explícito do usuário |
| `WORK.md` na raiz | Raiz do projeto, não dentro de `.batuta/` | Público primário é humano: na raiz ele convida edição (como um `TODO.md`) e é retomável por qualquer agente ou colega sem conhecer o Batuta — estado não é refém da ferramenta. `.batuta/` fica para os bastidores do maestro. Custo aceito: um arquivo a mais na raiz |
| Modelo explícito no roteamento | Linha da tabela nomeia executor + modelo; onboarding checa executores e gera o routing local | Default global de CLI multi-modelo é o estado que o usuário deixou lá, não uma escolha — pode apontar para modelo caro e derrotar a otimização de custo sem ninguém perceber. Codex sob assinatura é exceção (custo flat) |
| Adapters dormentes | Adapter só é lido quando sua linha da tabela é roteada ou adicionada; onboarding checa apenas o que a tabela referencia, nunca varre a máquina atrás de CLIs | Custo de contexto precisa ser constante conforme o catálogo de adapters cresce — com varredura, cada CLI nova (cursor, copilot, kimi CLI…) encareceria onboarding e classificação para todo mundo, mesmo quem não a usa |
| Mapeamento de lanes é escolha do usuário | Onboarding propõe as lanes a partir dos executores instalados e o usuário confirma/ajusta qual CLI/provider/modelo assume cada uma; setups parciais viram tabelas válidas (só claude → lanes por modelo Claude) | A tabela default assume o trio completo, mas o setup real varia; impor o default a quem só tem claude ou claude+opencode quebraria o roteamento na primeira tarefa. O usuário decide, o Batuta descobre e sugere |
| Lane complexa delegável ao codex | Tabela ganha 4 faixas: complexa (codex + modelo forte, reasoning alto) separada de crítica (claude); divisa é o brief autossuficiente, não o tamanho | Sob assinatura ChatGPT o custo por tarefa é flat — modelo forte na complexa entrega capacidade sem custo extra, reservando o Claude (lane mais cara) para o que realmente exige contexto da conversa ou julgamento. Na dúvida classifica crítica: errar para cima custa diferença de preço, errar para baixo custa ciclo de delegação falho |
| Variante Claude na lane complexa | Onboarding oferece mapear a complexa para modelo Claude forte via instância background (`claude -p --model opus`) como alternativa ao codex + modelo forte; a crítica segue sempre com a sessão | Lógica pesada que passa no teste do brief não precisa do modelo da sessão — um Claude forte em background resolve mais barato, e há quem prefira Claude a codex para esse trabalho. O limite é contexto, não capacidade: instância background não vê a conversa, então a variante nunca absorve a crítica |
| Batedor (lane de pesquisa) | Segunda tabela "Support lanes" no `routing.md` com executor barato read-only para varredura de mapa, contexto de brief e perguntas ad-hoc; relatório de contrato fixo, verificação estrutural (`ls`/`grep`), guarda de git e fallback para o maestro | Pesquisa era paga pelo modelo caro da sessão; um modelo de centavos em background devolve o destilado. Ortogonal à escada (falha não escala — volta ao maestro); modo de falha silencioso de modelo pequeno (referência inventada) é coberto pela verificação estrutural, que custa centavos e não traz conteúdo ao contexto premium |
| Superfície de comandos revista | 8 comandos: `/batuta` (só o ciclo, com gates) + init (onboarding/reconfiguração como único caminho), pause/resume (handoff transitório) e renames plan/status/route/review sem prefixo | O skill principal acumulava setup + ciclo e não havia como reconfigurar nem pausar; comando real (`plugin:skill`) divergia do documentado. Revisa as decisões "Comandos: 5" e "Onboarding automático na 1ª execução" (onboarding agora mora no `/batuta:init`). Breaking rename aceito em 0.x com um usuário; CHANGELOG avisa |
| Registro de decisões de regência | Linha do `WORK.md` carrega executor + modelo + escaladas; agregação só sob demanda no `/batuta:status` | O valor se demonstra com fatos (taxa de delegação, taxa de escalada), não com contabilidade inventada — o Batuta não tem como saber tokens nem preços de cada CLI. Valores em dinheiro só se o usuário fornecer preços de referência na tabela de roteamento. Telemetria segue fora do escopo |
| Idiomas | Instruções para ferramentas (skills, adapters, templates, routing) em inglês; docs de usuário (README, PRD) em PT-BR | Modelos seguem melhor instruções em inglês; o público-alvo (devs do Brasil) lê a documentação em PT-BR |
| Decomposição no ciclo | Step 1.5: pedido multi-entregável vira N tasks (menor unidade verificável e commitável), ciclo inteiro e commit por item; sequencial default com `parallel` no perfil; anuncia e executa sem parada de confirmação | Feedback de uso real (2026-07-20): a lista inteira virava um brief e um commit no final — o commit atômico do §6.3 só se sustenta se a decomposição definir o que é "um task", e a verificação por item impede que uma falha contamine o lote |
| Integração com superpowers | Documento central `superpowers.md` na raiz; detecção em runtime, automática, sem toggle; método do superpowers, regras materiais do Batuta (artefatos, routing, verify/commit por item); linha de método condicional em todo brief para executores que tenham superpowers | Skills de processo maduras elevam a regência sem criar dependência: ausente o plugin, cada passo segue o texto baseline da skill; executores externos degradam sozinhos ignorando a condição do brief |
| Worktree por tarefa | Executor commita WIP em worktree próprio (`.batuta/worktrees/<slug>`, branch `batuta/<slug>`); maestro verifica no branch e integra por squash com a mensagem da metodologia; perfil ganha `Worktree` (`off`/`medium+`/`always`, default `medium+`) e `Install:` opcional; ignore local via `.git/info/exclude` | Isolamento de verdade: o main nunca fica sujo e rejeição é deletar o worktree, não reverter; squash preserva o commit atômico e a autoridade da mensagem com o maestro; gate por lane evita cerimônia em tarefa trivial; exclude local respeita a fronteira de escrita (`.gitignore` é do usuário) |
