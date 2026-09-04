# Decomposição no ciclo — commits atômicos de verdade

**Data:** 2026-07-21 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

Feedback de uso real (projeto cobaia, 2026-07-20): o ciclo promete "um task
verificado = um commit" (Step 5), mas nada define o que é *um task*. Uma lista
de 6 componentes vira um brief só, uma delegação só ao codex, uma verificação
do lote e um commit no final — que não é atômico. A lacuna está entre o Step 1
(classificar) e o Step 2 (brief): não existe passo de decomposição.

## Decisões (tomadas em conversa)

1. **Ciclo inteiro por item** — cada entregável vira um brief próprio:
   delegar → verificar → commitar por item. Atomicidade no commit *e* na
   verificação; uma falha não contamina o lote.
2. **Sequencial por default, configurável** — item por item no checkout
   principal. O modo (`sequential` | `parallel`) vive no `.batuta/profile.md`,
   perguntado no `/batuta:init` e alterável no reconfigure. Override verbal
   por tarefa continua valendo.
3. **Anuncia e executa** — o maestro mostra a decomposição em uma linha por
   item e já começa o primeiro ciclo, sem parada de confirmação.

## Desenho

### Step 1.5 — Decompose (novo passo, entre classificar e brief)

- **Gatilho:** o pedido contém mais de um entregável independentemente
  verificável (lista de componentes, "X, Y e Z", escopo plural).
- **Regra da unidade:** um task é o menor entregável que pode ser verificado
  e commitado sozinho. 6 componentes = 6 tasks.
- **Roteamento por item:** cada task é classificado individualmente — uma
  lista pode misturar trivial e medium, cada um vai para sua lane.
- **Anúncio:** uma linha por item (`1/6 → codex: medium — componente Card`),
  execução imediata.
- **Exceção declarada:** itens acoplados que não podem ser verificados
  separadamente permanecem um task só — dito no anúncio, nunca o caminho
  padrão silencioso.
- **Ordem por dependência:** itens com dependência entre si executam na ordem
  que a dependência impõe; independentes seguem a ordem da lista.

### Modo de execução

- **Sequencial (default):** por item — brief → delega → verifica → commita →
  linha no `WORK.md` → próximo.
- **Paralelo (config ou pedido verbal):** vale o Step 3 atual (executores em
  background, worktree por executor quando há risco de conflito), mas
  verificação e commit continuam por item, conforme cada um retorna.
- A preferência vive no `.batuta/profile.md` (linha de execução), escrita no
  onboarding e alterável no reconfigure.

### Economia de brief

O bloco de Contexto + Convenções é montado uma vez para o lote (incluindo o
despacho de batedor, se houver) e reutilizado em todos os briefs dos itens; só
Goal, critérios de aceite e boundaries variam por item. 6 ciclos não custam
6× a pesquisa.

### Falha no meio do lote

Retry + escalação por item, como o ciclo já define. Item que falha mesmo
escalado: pula, segue com os itens independentes restantes, reporta no final.
Itens que dependiam do falho ficam bloqueados e reportados — nunca executados
às cegas.

### Reforço no Step 5

Linha explícita no ciclo: N tasks entregues = N commits; agrupar tasks num
commit é violação do ciclo, não atalho.

## Arquivos tocados

- `skills/batuta/SKILL.md` — novo Step 1.5; ajuste no Step 2 (contexto
  compartilhado do lote), Step 3 (modo de execução vem do profile), Step 5
  (reforço N tasks = N commits).
- `skills/init/SKILL.md` — pergunta do modo de execução no first run (junto
  das questões de metodologia) e no reconfigure; escrita no profile.
- `README.md` — documentar a garantia de decomposição/commit atômico.
- `docs/PRD.md` — §6.3 (ciclo) e registro da decisão em §9.

## Fora de escopo

- Comando dedicado de decomposição (`/batuta:split`) — decomposição é parte
  do ato de reger, não superfície de comando.
- Mudanças no `routing.md` — a tabela roteia *quem* executa; a decomposição
  define *o quê*, e mora no ciclo.
- Pipeline (delegar N+1 em background durante verificação de N) — descartado
  por ora; sequencial e paralelo cobrem os casos.
