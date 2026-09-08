<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/batuta-ai/.github/main/brand/readme-header-batuta-dark.png">
  <img src="https://raw.githubusercontent.com/batuta-ai/.github/main/brand/readme-header-batuta-light.png" width="100%" alt="batuta-ai / batuta — Integração com hosts e ponto de entrada da plataforma. Host integration and platform entry point.">
</picture>


> 🇺🇸 [English version](README.md)

> **Quem rege não toca.**

O **Batuta** transforma o agente de código com quem você já conversa em
**maestro**: classifica a tarefa, roteia para o executor mais barato que dá
conta, escreve o brief, delega, verifica o diff e commita. Quem escreve o código
são os **instrumentistas** — `codex`, `opencode` (Kimi, DeepSeek, GLM…),
`cursor-agent`, `agy` (Antigravity), um `claude` em background — ou o próprio
maestro, só no trabalho crítico.

Você gasta o modelo caro onde importa (decidir, revisar, garantir qualidade) e
centavos onde qualquer modelo resolve (escrever o código de uma tarefa bem
especificada).

Este repositório é o **pacote de hosts**: uma instalação para cada CLI. As
skills e a doutrina vivem em [batuta-ai/skills](https://github.com/batuta-ai/skills)
(vendoradas aqui em `skills/`), o binário `batuta` em
[batuta-ai/core](https://github.com/batuta-ai/core) e a extensão do CompozyOS
em [batuta-ai/compozy](https://github.com/batuta-ai/compozy).

## Instalação

Um comando, todo host detectado:

```bash
npx -y github:batuta-ai/batuta
```

`--list` mostra a matriz de hosts, `--dry-run` imprime o que rodaria,
`--only <host>` mira um só. Por host, a mesma coisa à mão:

| Host | Instalação | Pontos de entrada |
|---|---|---|
| Claude Code | `claude plugin marketplace add batuta-ai/batuta` · `claude plugin install batuta@batuta` | a skill `batuta` em qualquer tarefa de código; `/batuta:init`, `/batuta:plan`, `/batuta:loop`, `/batuta:review`, `/batuta:status`, `/batuta:route`, `/batuta:pause`, `/batuta:resume` |
| Codex CLI | `codex plugin marketplace add batuta-ai/batuta` · `codex plugin add batuta@batuta` | `$batuta`, `$batuta-init`, `$batuta-plan`, … |
| Cursor | `npx -y github:batuta-ai/batuta -- --only cursor` (vendored skills → `~/.agents/skills`) | as skills, pelo nome |
| opencode | `npx -y github:batuta-ai/batuta -- --only opencode` (vendored skills → `~/.agents/skills` + `hosts/opencode/commands/`) | `/batuta`, `/batuta-init`, … |
| Antigravity (`agy`) | `npx -y github:batuta-ai/batuta -- --only agy` (skills vendoradas → `~/.agents/skills`); qualquer outro agente: `npx skills add batuta-ai/skills -g -a <agente>` (sem `-a` a skills CLI também linka as skills no Claude Code e no Codex, que já as recebem pelo plugin) | as skills, pelo nome |
| CompozyOS | `compozy extension install github:batuta-ai/compozy --allow-unverified --yes` | o agente `batuta` |

O Codex também lê `~/.agents/skills`. Quando o plugin do Codex e um host de diretório compartilhado (Cursor, opencode, agy) coexistem na mesma máquina, o instalador acrescenta entradas `[[skills.config]]` em `~/.codex/config.toml` que desligam as cópias compartilhadas, e o Codex lista cada skill uma vez, pelo plugin.

O binário `batuta` (inventário de executores, gates de verificação, loop
autônomo) é baixado do [release fixado do batuta-ai/core](https://github.com/batuta-ai/core/releases)
para `~/.local/bin` (`BATUTA_BIN_DIR` muda o destino) e conferido contra o digest
fixado neste pacote e o `checksums.txt` do release; não precisa de Go. As skills
funcionam sem ele.

Depois, num projeto: `/batuta:init` uma vez, e é só pedir tarefas de código.

## Como funciona

```
        você: "corrige o 500 do login quando o email tem +"
          │
          ▼
   ┌─────────────┐    classifica: medium backend
   │   MAESTRO   │──► roteia: → codex (assinatura ChatGPT, já paga)
   │ (seu agente)│    escreve o brief: contexto + arquivos + critérios de aceite
   └──────┬──────┘
          │ delega
          ▼
   ┌─────────────┐
   │    CODEX    │──► escreve o código
   └──────┬──────┘
          │ diff
          ▼
   ┌─────────────┐    checagem de escopo, review do diff
   │   MAESTRO   │──► roda os testes ele mesmo
   │             │    reexecuta a prova de cada critério
   └──────┬──────┘
          │ ✅ passou
          ▼
    commit atômico + uma linha no WORK.md
```

Verificação falhou → o executor recebe feedback específico e **um retry**.
Falhou de novo → a tarefa **escala** uma linha na tabela. Pedido que é lista —
seis componentes, digamos — é **decomposto** antes: seis ciclos, seis commits.

## As quatro garantias

| Garantia | Como |
|---|---|
| **Commits atômicos** | uma tarefa verificada = um commit; desfazer é trivial |
| **Estado retomável** | um único `WORK.md` em prosa; feche o terminal, volte amanhã |
| **Plano quando precisa** | tarefa clara vai direto; ambígua ganha duas ou três perguntas; trabalho longo ganha `/batuta:plan` |
| **Verificação sempre** | escopo, review do diff, testes rodados pelo maestro, critérios com prova reexecutada — o relato do executor nunca é evidência |

## Roteamento

| Lane | Exemplos | Executor default | Custo |
|---|---|---|---|
| `low` | rename, config, texto, teste simples | opencode + modelo barato | centavos (API) |
| `medium` | feature isolada, bugfix com repro clara | codex, modelo default | assinatura ChatGPT |
| `high` | trabalho multi-arquivo que um brief preciso especifica por inteiro | codex, modelo mais forte, reasoning alto | assinatura ChatGPT |
| `critical` | arquitetura, segurança, o que precisa da conversa | o próprio host que rege | assinatura do host |

Linhas podem ser divididas por domínio (`frontend` → `cursor-agent`, por
exemplo). O onboarding descobre o que está instalado e propõe a tabela; você
confirma cada linha. Adicionar um executor é um arquivo markdown:
`skills/batuta/adapters/_template.md`.

`/batuta:status` lê o `WORK.md` como fatos: tarefas por lane, taxa de
delegação, taxa de escalada. Sem contabilidade inventada.

## Estrutura

```
.claude-plugin/  .codex-plugin/  .cursor-plugin/  .agents/plugins/   manifestos por host
commands/                roteadores finos /batuta:* para o Claude Code
hosts/opencode/commands/ os mesmos roteadores para o opencode
hooks/ scripts/          hook de SessionStart (uma linha de contexto) e o sync das skills
skills/                  vendorado de batuta-ai/skills na tag do skills-lock.json
bin/install.js           o instalador multi-host
docs/                    specs de design; docs/specs-history guarda o PRD v1 e os planos
```

`scripts/sync-skills.sh <tag>` atualiza as skills vendoradas; `tests/check.sh`
falha quando `skills/` diverge do lock.

## Filosofia

1. **Quem rege não toca** — tokens vão para dirigir, não para digitar código.
2. **O processo pesa o mínimo que a tarefa permitir** — planejamento é adaptativo, nunca pré-requisito.
3. **Estado é prosa, não schema** — nada quebra com um pipe não escapado.
4. **Toda entrega passa por verificação** — sempre, sem exceção.
5. **Extensível por arquivo, não por código** — novo executor = novo arquivo markdown.

## Inspirações

[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
(metas verificáveis, rastreabilidade do diff, órfãos), a família
[GSD](https://github.com/gsd-build/get-shit-done) (quais garantias valem o
peso), [pedronauck/skills](https://github.com/pedronauck/skills) (relato não é
evidência, escrita com escopo, rent test) e
[beer-and-code-harness](https://github.com/beerandcodeteam/beer-and-code-harness)
(gates mecânicos, preflight, roteadores finos).

## Licença

[MIT](LICENSE)
