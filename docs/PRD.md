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
│   ├── batuta/            # entrada principal — classifica, roteia, executa o ciclo
│   ├── batuta-plan/       # planejamento formal opcional
│   ├── batuta-status/     # exibe WORK.md e tarefas em andamento
│   ├── batuta-route/      # exibe/edita a tabela de roteamento
│   └── batuta-review/     # re-executa a verificação sobre qualquer diff
├── routing.md             # tabela de roteamento default (editável)
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
    └── plan-<slug>.md     # planos formais, quando existirem
```

## 6. Funcionalidades

### 6.1 Onboarding de projeto (primeira execução)

Na primeira invocação de `/batuta` em um projeto sem `.batuta/profile.md`, o
orquestrador conduz um onboarding curto (3–5 perguntas):

- **Tipo de projeto / stack** — React, Vue, Node API, outro (com detecção
  automática pelo package.json/composer.json etc. como sugestão default).
- **Metodologia** — TDD ou testes depois; conventional commits ou livre;
  trunk-based ou feature branches.
- **Comando de testes e de build** — para a etapa de verificação.

O resultado vira `.batuta/profile.md`. O template de stack correspondente
(`templates/react.md` etc.) é referenciado no perfil e suas convenções entram
automaticamente em todo task brief enviado aos executores. O usuário pode editar
o perfil a qualquer momento; o onboarding não se repete.

O perfil também ganha um **mapa do projeto**: 20–40 linhas em prosa (diretórios-
chave, onde vivem rotas/componentes/testes, pontos de entrada, o que é gerado e
não se toca), preenchidas no onboarding — varredura delegável a executor barato.
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

**Checagem de executores:** o onboarding roda as verificações de disponibilidade
dos adapters, mostra o que encontrou e, para CLIs multi-modelo (opencode),
confirma o modelo barato da lane trivial. O resultado vira o `.batuta/routing.md`
do projeto — a cópia local nasce no onboarding com modelos explícitos. Executor
ausente é informado na hora, junto com o colapso de lanes, em vez de descoberto
na primeira delegação.

### 6.2 Roteamento por complexidade

Tabela default (editável via `routing.md` do projeto ou `/batuta:route`):

| Complexidade | Exemplos | Executor | Custo |
|---|---|---|---|
| Trivial | rename, config, texto, teste unitário simples | opencode + modelo barato | centavos (API) |
| Média | feature isolada, bugfix com reprodução clara | codex | assinatura ChatGPT |
| Complexa | multi-arquivo, arquitetura, segurança | claude (orquestrador executa) | assinatura Claude |

- O orquestrador classifica sozinho e informa a decisão em uma linha
  ("→ codex: bugfix médio"). O usuário pode sobrescrever a qualquer momento
  ("usa kimi pra isso").
- **Escalada automática:** executor falhou na verificação 2× → tarefa sobe um
  nível de executor.
- **Modelo explícito:** em CLIs multi-modelo, a linha da tabela nomeia o modelo;
  o maestro nunca usa o default global do CLI, que pode apontar para um modelo
  caro e derrotar silenciosamente o roteamento de custo. Exceção: codex sob
  assinatura tem custo flat por tarefa — default aceitável.

### 6.3 Ciclo de execução (único, sem fases)

1. **Brief** — orquestrador monta o task brief: objetivo, contexto, arquivos
   relevantes, convenções do perfil/template, critérios de aceite.
2. **Delegar** — invoca o adapter via Bash (`codex exec …`, `opencode run …`).
3. **Verificar** — `git diff` review pelo orquestrador + testes do projeto +
   critérios de aceite do brief.
4. **Commitar** — commit atômico. Falha → 1 retry com feedback ao executor →
   escalada de nível.
5. **Registrar** — uma linha no `WORK.md`.

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

- **Com superpowers instalado:** usa `dispatching-parallel-agents` e
  `using-git-worktrees` para reger a distribuição.
- **Sem superpowers:** fallback para background tasks nativos do Claude Code.
- Detecção em runtime; nenhuma dependência rígida.

### 6.6 Estado (`WORK.md`)

```markdown
# WORK — <projeto>

## Em andamento
- [ ] <tarefa> → codex (delegada 2026-07-19)

## Feito
- [x] <tarefa> → kimi, commit abc123
```

Formato prosa + checkboxes. Sem tabelas com schema, sem validação estrita.

### 6.7 Comandos

| Comando | Função |
|---|---|
| `/batuta` | Entrada principal: onboarding (se 1ª vez), classifica, roteia e executa o ciclo |
| `/batuta:plan` | Força planejamento formal aprovável |
| `/batuta:status` | Mostra `WORK.md` e tarefas em background |
| `/batuta:route` | Exibe/edita a tabela de roteamento |
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
| Idiomas | Instruções para ferramentas (skills, adapters, templates, routing) em inglês; docs de usuário (README, PRD) em PT-BR | Modelos seguem melhor instruções em inglês; o público-alvo (devs do Brasil) lê a documentação em PT-BR |
