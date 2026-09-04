# Trilha de execução e escopo declarado — destilação do CompozyOS

**Data:** 2026-07-31 · **Status:** proposta (discutida em conversa 2026-07-31), aguardando aprovação

## Origem

Leitura da doc do [CompozyOS](https://www.compozy.com/docs/) com a mesma
lente da destilação pedronauck: contrato antes de importação. O Compozy é
um *agent operating system* — um daemon que orquestra CLIs de agente já
existentes como **sessões duráveis**, inspecionáveis e replayáveis, com
memória por workspace e ferramentas filtradas por política.

O que **não** se adota: agentes por fase do ciclo (contraria "ciclo único,
sem fases", PRD §6.3), daemon, jobs/triggers/webhooks, Compozy Network e
marketplace — todos pressupõem runtime próprio, e o Batuta é texto sobre o
Claude Code. O que **não precisa** ser adotado: memória e política por
workspace, que o `.batuta/profile.md` já cobre.

Sobram dois contratos que valem, e que este documento especifica. São
independentes: podem ser implementados em ondas separadas.

---

## Proposta 1 — Trilha de execução (`.batuta/runs/`)

### Problema

O Compozy retém transcript e histórico de eventos por sessão
explicitamente "for audit purposes". O Batuta tem `WORK.md` — prosa, uma
linha por tarefa, ótimo para retomar — e **nada mais**. O brief enviado ao
executor, a saída bruta que ele devolveu e o raciocínio do veredito
evaporam quando a sessão fecha.

Isso contradiz uma regra que o próprio projeto já escreveu: o
`verification.md` abre com "declared ≠ verified" e exige que o maestro
reproduza a prova de cada critério. Mas depois do commit não sobra registro
de *o que foi declarado* nem *o que foi reproduzido* — só a linha do
`WORK.md` dizendo que passou. Na prática:

- o retrô (`docs/qa-retro.md`) julga o ciclo por memória, não por evidência;
- sintomas registrados como o de **commits atômicos falhos** não têm
  material para diagnóstico — não dá para saber se o brief tinha escopo
  frouxo, se o executor extrapolou, ou se o maestro agrupou no commit;
- o contrato de cross-review já produz um artefato de findings fora do
  repositório, que hoje é descartado.

### Proposta

Cada ciclo verificado deixa **um arquivo de trilha**, escrito no Step 5
junto com o commit:

`.batuta/runs/<AAAA-MM-DD>-<slug>.md`

```markdown
# Run — <título da tarefa>

**Data:** <data> · **Lane:** <trivial|média|complexa|crítica> · **Executor:** <executor + modelo>
**Commit:** <sha> · **Veredito:** ✅ aprovado | ⏫ escalado de <lane> | ❌ abortado

## Brief
<o brief enviado ao executor, verbatim>

## Relato do executor
<a saída relevante do executor, verbatim — não resumida>

## Verificação
- Critério 1 — prova reproduzida: `<comando>` → <resultado observado>
- Critério 2 — ...
- Scans de higiene de teste: <n/a | limpos | achado X em file:line>
- Cross-review: <n/a | findings aceitos/recusados, uma linha cada>

## Retentativas e escalonamento
<vazio quando passou de primeira; senão, o que falhou e o que mudou no re-brief>
```

Regras:

1. **Verbatim onde importa.** Brief e relato do executor entram sem
   resumo — resumir é justamente perder a evidência. A seção de verificação
   é do maestro e é curta: comando + resultado observado, não narrativa.
2. **Uma trilha por tarefa, não por sessão.** A unidade do Batuta é o
   commit atômico; a trilha acompanha essa unidade. Num lote (Step 1.5),
   seis itens = seis trilhas, mesmo com Context compartilhado.
3. **`WORK.md` aponta, não incha.** A linha do `WORK.md` ganha no máximo a
   referência ao arquivo de trilha. O público do `WORK.md` continua sendo
   humano e retomável sem conhecer o Batuta (decisão registrada, PRD §9).
4. **Local por default.** `.batuta/runs/` entra no `.git/info/exclude`,
   pelo mesmo motivo dos worktrees: `.gitignore` é do usuário. Quem quiser
   versionar a trilha remove a linha — o Batuta nunca decide isso sozinho.
5. **Findings de cross-review têm destino.** O artefato de findings que o
   contrato já exige fora do repositório é copiado para a seção
   Verificação da trilha após o julgamento do maestro. O arquivo externo
   segue descartável; a decisão fica.
6. **Sem retenção automática.** Nada de rotação, TTL ou compactação — é
   arquivo de texto num diretório local. Se um dia incomodar, o usuário
   apaga.
7. **Tarefas abortadas também deixam trilha.** Um item que falha depois do
   escalonamento é onde a evidência vale mais. A trilha é escrita mesmo sem
   commit, com veredito `❌ abortado`.

### Fronteiras

- Escrita em `.batuta/` — dentro da fronteira existente.
- Não é memória: a trilha é registro do que aconteceu, não contexto para
  alimentar sessões futuras. O maestro não lê `.batuta/runs/` durante o
  ciclo; só o retrô, o `/batuta:review` sob pedido e o humano leem.
- Não substitui `WORK.md` nem o handoff do `/batuta:pause`.

### Critérios de aceite

- Todo ciclo que chega ao Step 5 produz exatamente uma trilha por tarefa
  verificada, e itens abortados também produzem a sua.
- A trilha permite responder, sem a sessão original: qual foi o brief, o
  que o executor declarou, qual prova o maestro reproduziu, e por que o
  veredito foi esse.
- `WORK.md` não cresce além da referência.
- Peso: `skills/batuta/SKILL.md` cresce ≤ ~15 linhas no Step 5; o formato
  da trilha, se passar disso, vira reference dormante.

---

## Proposta 2 — Escopo declarado no brief

### Problema

O Compozy fala em *policy-filtered native tools* e sandbox por workspace: o
agente gerenciado não tem alcance ilimitado, o alcance é declarado.

O Batuta já tem a metade disso. O Step 2 carrega **Boundaries — what NOT to
touch**, e o Step 4 aplica o **teste de rastreabilidade** ("toda linha
alterada deve remeter ao brief; drive-by edits reprovam mesmo corretos").
O que falta é o par positivo e mecânico:

- Boundaries é prosa negativa — descreve o que evitar, não delimita onde
  trabalhar. Um executor que não sabe onde mexer inventa o alcance.
- A rastreabilidade é um julgamento sobre *conteúdo* de linha, feito
  depois. Não existe checagem sobre o **conjunto de caminhos** do diff, que
  é onde o extravasamento aparece primeiro e é barato de detectar.

Consequência plausível para o sintoma já registrado de commits atômicos
falhos: executor toca arquivos fora do previsto → diff grande e
heterogêneo → o maestro agrupa no commit em vez de reprovar. Sem escopo
declarado, o maestro não tem contra o quê comparar.

### Proposta

Um campo novo no brief (Step 2), pareado com Boundaries:

- **Escopo** — a lista de caminhos que a tarefa pode alterar. Arquivos
  quando conhecidos; diretórios ou globs quando a descoberta faz parte da
  tarefa. Fechada com a frase operacional: *não altere nada fora desta
  lista; se a tarefa exigir, pare e reporte* — que é exatamente uma das
  Stop conditions que o brief já carrega, agora com referente concreto.

E a checagem correspondente no Step 4, antes do review de diff:

- **Checagem de escopo** — `git diff --name-only` (no worktree,
  `git diff --name-only main...batuta/<slug>`) contra a lista declarada.
  Caminho fora da lista = **falha de verificação**, pelo fluxo normal:
  feedback específico (nomeando os arquivos) + 1 retentativa, depois
  escalonamento.

Regras:

1. **Escopo é obrigatório como todo campo do brief.** Sem lista fechada,
   `Unknown — <motivo>` com o alcance mais estreito que a tarefa admite
   (o diretório, o módulo). Campo vazio já é violação de brief pela regra
   que existe hoje.
2. **Ampliar é decisão do maestro, não do executor.** Quando o executor
   para e reporta que precisa sair do escopo, o maestro decide: amplia a
   lista e re-briefa, ou reclassifica a tarefa. Isso é o comportamento
   desejado — a parada vira sinal de tarefa mal dimensionada.
3. **Exceções nomeadas, não implícitas.** Arquivos de lock, snapshots e
   gerados que a tarefa legitimamente toca entram na lista explicitamente.
   Nenhuma lista de isenção global.
4. **Arquivos de teste contam.** Se a tarefa exige teste, os caminhos de
   teste entram no escopo. Não entrar é como o executor justifica ter
   mexido onde não devia.
5. **Lanes baratas ganham mais, não menos.** Escopo estreito é justamente o
   que faz um modelo fraco render — anda junto com a prescrição que as
   lanes baratas mantêm de propósito (Sweep, Step 2).
6. **A checagem é mecânica e vem primeiro.** É a mais barata das
   verificações e a que mais economiza: um diff fora de escopo não merece
   review de conteúdo.

### Fronteiras

- Não é sandbox de verdade: o Batuta não restringe o que a CLI executora
  *consegue* fazer, só declara o contrato e reprova a violação depois.
  Sandbox real depende do adapter e fica fora de escopo aqui.
- Não muda a tabela de roteamento nem o formato do commit.
- Boundaries continua existindo: escopo diz onde pode mexer, Boundaries diz
  o que não tocar dentro e fora disso (ex.: "não mude a assinatura pública
  de X"). São complementares, não substitutos.

### Critérios de aceite

- Todo brief de código sai com Escopo preenchido ou com `Unknown` motivado.
- Um diff que toca caminho não declarado reprova na verificação, com os
  arquivos nomeados no feedback — mesmo que o código esteja correto.
- Executor que para por limite de escopo é tratado como parada legítima
  (re-brief ou reclassificação), nunca como falha do executor.
- Peso: `skills/batuta/SKILL.md` cresce ≤ ~10 linhas somando Step 2 e
  Step 4.

---

## Ordem sugerida

A Proposta 2 primeiro: é menor, endereça um sintoma já observado em uso
real, e produz o campo que a Proposta 1 registra. A Proposta 1 em seguida,
já com escopo declarado para gravar na trilha.

Ambas ficam atrás do `spec-pipeline` e do retrô no cobaia, que já estão
priorizados.

## Não-objetivos declarados

- Agentes por fase (discussão / planejamento / dev / review / QA). O ciclo
  é único; discussão é coberta pelo spec-pipeline no `/batuta:plan`, review
  pelo `/batuta:review` + cross-review. Fragmentar o maestro em subagentes
  perderia o contexto da conversa, que é justamente o que define a lane
  Crítica.
- Daemon, sessões de background persistentes, triggers, webhooks, rede de
  peers e marketplace.
- Retenção, indexação ou busca sobre `.batuta/runs/`.
- Sandbox de execução real (restrição efetiva de acesso ao filesystem pelo
  executor).
