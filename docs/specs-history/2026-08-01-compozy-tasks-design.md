# Tasks Compozy como ciclo de vida da delegação — kanban com estado verificado

**Data:** 2026-08-01 · **Status:** aprovada em conversa (2026-08-01), aguardando implementação

## Origem e enquadramento

Continuação da integração CompozyOS (spec 2026-07-31 do runtime). Aquela
spec cobriu **sessões**: delegação, paralelismo, status, pause/resume. O
Compozy tem outro músculo ainda não usado: o sistema de **tasks** —
tarefas duráveis com prioridade, dependências, child tasks, runs com
claim/lease/heartbeat, blocks tipados e retry — que alimenta o kanban da
UI web (`compozy open`).

O quadro de três camadas não muda: o Compozy é **host**, nunca maestro.
Tasks entram como registro de ciclo de vida da execução, não como fila
de decisão — quem raciocina e roteia continua sendo o maestro.

Decisões tomadas na conversa de design (2026-08-01):

1. **Papel:** ciclo de vida da delegação — espelho do plano + task runs
   reais por delegação. Não é fila real: `WORK.md` continua a única
   fonte de verdade (PRD §9 intacto).
2. **Quem dirige:** o maestro. O executor nunca sabe que a task existe;
   o brief não muda. `complete` só após verificação — o kanban reflete
   estado **verificado**, não auto-relatado.
3. **Escopo:** só tasks. Canais (`ch`), Memory v2 e automation/loop
   ficam para specs futuras, cada um avaliado isoladamente.
4. **Granularidade:** item do plano = task. Cada item de trabalho do
   `WORK.md` vira uma task Compozy; a delegação é um run dessa task.

## Problema

Com `Runtime: compozy`, o daemon já enxerga as *sessões* dos
instrumentistas, mas não o *plano*: não há backlog, ordem, nem estado
por item de trabalho visível na UI. O kanban do Compozy existe de graça
e ficaria vazio. Além disso, o ciclo de vida da execução (rodando,
falhou, bloqueado, verificado) vive só no `WORK.md` — correto como
verdade, mas invisível como painel.

## Proposta

### Onde vive

Nenhum arquivo novo: **seções novas no `compozy.md`** existente, mesmo
padrão dormante. Mesmos gatilhos de ativação do runtime
(`Runtime: compozy` no perfil ou `COMPOZY_SESSION_ID` no ambiente) —
tasks são parte da integração de runtime, sem linha nova de perfil.
As skills não crescem: já apontam para o `compozy.md`.

### Mapeamento — momento do ciclo → ação de task

| Momento do ciclo | Ação de task | Efeito no kanban |
| --- | --- | --- |
| Item entra no `WORK.md` (Step 1/1.5) | `task create --identifier batuta/<slug>` com metadata (lane, executor) | backlog visível |
| Ordem/dependência do plano | `task dependency add` | ordem no board |
| Item de lote paralelo | child task do item-pai | lote agrupado |
| Dispatch (Step 3) | `task start` + claim do run pelo maestro | "em execução" |
| Step 4 **aprovado** | `task complete --result '{veredito}'` | done = verificado |
| Retry (mesma sessão) | run segue vivo; `heartbeat` estende o lease | continua "em execução" |
| Retry esgotado / escalação | `task fail` no run; nova tentativa = `task retry` | falha visível + nova tentativa |
| Bloqueio | `task block --reason` tipado / `unblock` ao resolver | coluna de bloqueados honesta |

Regras transversais do mapeamento:

- **Identificador:** `batuta/<slug>` — o mesmo slug da sessão
  (`batuta/<slug>` em `session new`/`spawn`), para task e sessão se
  encontrarem por nome. Metadata da task carrega lane e executor da
  linha de roteamento.
- **Trilha:** `runs.md` grava o id da task ao lado do id da sessão como
  referência de replay.
- **Sincronização unidirecional** (`WORK.md` → Compozy): no
  `/batuta:resume`, reconciliar criando o que falta no board; **nunca**
  ler estado do board de volta para o `WORK.md`. O board é lente, não
  memória.
- **O scout não vira task** — mesma regra das sessões: dispatches de
  pesquisa duram segundos e não são itens de trabalho.
- **Escalação** troca a sessão (spec do runtime), não a task: o run
  falho recebe `task fail`, a nova tentativa é `task retry` na mesma
  task — o histórico de tentativas fica agregado por item de trabalho.

### Degradação limpa (regra de todas as integrações)

Toda chamada de task é *best-effort*: daemon fora do ar ou comando
recusado → aviso em voz alta e o ciclo segue só com `WORK.md`. O ciclo
jamais espera ou falha por causa do board. Coerente com o critério
registrado: nenhuma regra do ciclo depende de capacidade exclusiva de
um host.

### Status (`/batuta:status`)

A linha de status do `compozy.md` ganha a fonte de tasks além das
sessões (`compozy task list --query batuta/ -o json`), e menciona
`compozy open` como acesso ao kanban. `WORK.md` permanece a fonte de
verdade; o board é uma lente.

## Fronteiras

- **O ciclo não muda uma vírgula.** Brief, verificação endurecida,
  veredito, commit atômico: idênticos. Tasks só tornam o ciclo de vida
  visível e durável no host.
- **Fonte de verdade continua em texto no repo.** `WORK.md` +
  `.batuta/runs/`. Divergência entre board e `WORK.md` se resolve
  sempre a favor do `WORK.md`.
- **Aprovações (`task approve`/`reject`) ficam fora** — adicionariam
  cerimônia humana que o fluxo autônomo não tem hoje. Se um dia entrar,
  é spec própria.
- **Canais, Memory v2, automation/loop: fora de escopo** (decisão 3).

## Residual a verificar na implementação

`task next` faz claim "para a sessão de agente atual" — com o maestro
**fora** do daemon (gatilho de perfil) pode responder
`identity_required`. Verificar na CLI se existe caminho de operador
(`task fail` menciona "operator override"; existe `task release`). Se o
claim exigir sessão gerenciada, o modo não-gerenciado usa só os estados
da task (`start`/`complete`/`fail`/`block`) sem lease — mesma semântica
no kanban, sem heartbeat. Confirmar também o shape JSON de
`task create`/`task list` na versão instalada ao escrever as seções do
`compozy.md`.

## Critérios de aceite

- Sem runtime ativo (sem linha `Runtime:` e fora de sessão gerenciada):
  comportamento byte-idêntico ao atual, com ou sem Compozy instalado.
- Com runtime ativo: cada transição do ciclo aparece no board com o
  estado da tabela de mapeamento; `complete` só ocorre após a
  verificação do Step 4 aprovar.
- Retry esgotado aparece como run falho + nova tentativa na mesma task.
- Bloqueio de item aparece como block tipado; resolver o bloqueio o
  limpa.
- `/batuta:resume` reconcilia o board criando tasks que faltam; nunca
  altera o `WORK.md` a partir do board.
- Daemon caindo no meio do ciclo: a tarefa termina normalmente, com
  avisos em voz alta a cada chamada de task falhada.
- Peso: zero linhas novas nas skills; todo o detalhe nas seções novas
  do `compozy.md` dormante.
