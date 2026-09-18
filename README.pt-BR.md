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

O planejamento e a execução de QA usam `/batuta:qa-plan` e `/batuta:qa-run`
no Claude Code, `$batuta-qa-plan` e `$batuta-qa-run` no Codex,
`/batuta-qa-plan` e `/batuta-qa-run` no opencode e os nomes de skill
`batuta-qa-plan` e `batuta-qa-run` nos hosts de diretório compartilhado. O ponto
de entrada de planejamento cria ou atualiza o plano vivo de QA; o de execução
realiza as sessões planejadas com personas e grava evidências, vereditos,
achados e debriefs de volta nesse plano.

O refinamento de planos e a edição de texto usam `/batuta:refine` e
`/batuta:write` no Claude Code, `$batuta-refine` e `$batuta-write` no Codex,
`/batuta-refine` e `/batuta-write` no opencode e os nomes de skill nos hosts de
diretório compartilhado. `batuta-refine` resolve decisões materiais em rodadas
limitadas de uma a três perguntas sem reabrir escolhas já definidas nem
autorizar implementação. `batuta-write` edita ou redige a partir das evidências
fornecidas, preservando fatos, incertezas, citações, texto técnico protegido e
os contratos dos planos Batuta; não autoriza publicar, enviar ou alterar código.

O despacho nativo exige adesão explícita: adicione `Dispatch: auto` a
`.batuta/profile.md` para que um maestro interativo possa usar um subagente
nativo do host somente quando rota, modelo, esforço, isolamento do workspace e
permissões exatos forem compatíveis. Subagentes nativos do host são separados do
despacho ACP externo; o core headless não tem filhos nativos do host. O padrão
continua sendo o despacho externo por CLI. O ACP externo também exige adesão, e
somente OpenCode `1.18.31` via `opencode acp` em `darwin-arm64`, usando
`opencode/big-pickle` com esforço vazio, é qualificado. O padrão e
`--transport auto` usam a CLI para todos os demais provedores, versões,
plataformas, modelos ou esforços. `--transport acp` explícito com uma tupla não
qualificada encerra como indisponível; nunca muda a rota nem o transporte.
Resultados nativos ou ACP parciais, cancelados ou incertos nunca são repetidos
automaticamente pela CLI. Para o ciclo de vida do processo ACP qualificado, o
encerramento é limitado ao grupo de processos sob controle e os filhos diretos
são coletados, mas isso não garante a contenção de descendentes arbitrários que
escapem desse grupo. O [piloto de despacho medido](docs/dispatch-pilot.md) não
estabeleceu economia de tokens nem equivalência de qualidade, portanto nenhuma
economia é alegada e o ACP continua opt-in.

O Codex também lê `~/.agents/skills`. Quando o plugin do Codex e um host de diretório compartilhado (Cursor, opencode, agy) coexistem na mesma máquina, o instalador acrescenta entradas `[[skills.config]]` em `~/.codex/config.toml` que desligam as cópias compartilhadas, e o Codex lista cada skill uma vez, pelo plugin.

### Skills compartilhadas: quem é dono do quê

- O Batuta é dono das cópias vendoradas que instala em `~/.agents/skills` e registra os hashes do conteúdo delas em `.batuta-skills-lock.json`.
- Uma cópia alterada localmente, inclusive por `npx skills update`, pertence ao usuário: uma instalação normal a mantém e imprime um aviso. A garantia depende do hash registrado por uma instalação anterior desta versão ou posterior; ao atualizar de um lock antigo, toda cópia é substituída uma vez, então faça backup das skills customizadas antes dessa primeira execução.
- `--force-skills` dá explicitamente ao instalador permissão para substituir cópias customizadas e aposentar skills customizadas que o release não distribui mais.
- O instalador nunca altera o diretório `.agents/skills` de um projeto.

O binário `batuta` (inventário de executores, gates de verificação, loop
autônomo) é baixado do [release fixado do batuta-ai/core](https://github.com/batuta-ai/core/releases)
para `~/.local/bin` (`BATUTA_BIN_DIR` muda o destino) e conferido contra o digest
fixado neste pacote e o `checksums.txt` do release; não precisa de Go no Linux,
macOS e Windows 10 ou posterior (x64). `--no-core` ignora o binário e ainda
instala ou atualiza a integração do host e todas as treze skills, inclusive
`batuta-refine` e `batuta-write`; as skills funcionam sem o binário, mas
inventário, despacho ACP externo, gates de verificação e recursos do loop
autônomo exclusivos do core não funcionam.

### Atualização

Execute o instalador novamente para atualizar o plugin ou as skills
compartilhadas dos hosts detectados e instalar o binário do core fixado pelo
pacote:

```bash
npx -y github:batuta-ai/batuta
batuta version
```

O pacote atual fixa o core em `v1.1.0-beta.24`; `batuta version` deve mostrar
essa versão. Atualizar apenas o plugin pelo host não atualiza o binário separado
do core. Se o instalador indicar outro `batuta` antes dele no `PATH`, ajuste o
`PATH` para usar o binário instalado. Reinicie a sessão do host após atualizar
para carregar o plugin ou as skills atualizados. Skills compartilhadas
customizadas seguem as regras de preservação acima.

### Supervisão em primeiro plano

A supervisão em primeiro plano e a revisão final automática foram introduzidas
no core `v1.1.0-beta.23` e continuam disponíveis no `v1.1.0-beta.24` fixado pelo
pacote, nos fluxos normais de nova execução, retomada, resposta e roadmap do
loop. O runner mantém a responsabilidade pela execução. Depois de finalizar
a implementação, a revisão verifica um snapshot imutável da entrega. Revisão
ausente, falha, incerta ou com achados que exigem correção bloqueia o avanço do
roadmap mesmo após reiniciar; `review_blocked` termina com código `2`. Um
relatório `SHIP` íntegro libera apenas a progressão, não autoriza merge ou
publicação. Julgamentos explícitos exigem o digest exato das evidências da
revisão e uma justificativa. Consulte o [guia de supervisão do core](https://github.com/batuta-ai/core/blob/main/docs/loop-supervision.md)
para comandos de consulta, julgamento e recuperação.

`batuta loop --supervise <delivery> --cursor <caminho-absoluto>` continua
disponível como observador separado em primeiro plano. `--once` faz uma
observação; `--notify <diretório-absoluto-existente>` grava arquivos JSON
privados por evento, enquanto `--notify desktop` usa um notificador já
instalado no macOS ou Linux. Um `--policy` explícito e vinculado a digests pode
fornecer um esclarecimento para uma tarefa aprovada e retomar o runner normal,
ou reservar uma proposta de correção aprovada pelo operador. Iniciar a
supervisão não autoriza essas ações. O processo precisa continuar ativo; não
instala daemon nem envia mensagens automáticas ao chat. Sem `--notify`, os
eventos continuam não lidos no cursor durável. Não há alegação de economia
medida de tokens.

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
