# Destilação do pedronauck/skills — o que o Batuta absorve e onde

**Data:** 2026-07-26 · **Status:** aprovada em conversa · Ondas 1–3 entregues (2026-07-26); Onda 4 na fila (retrô do cobaia)

## Contexto

Revisão completa do catálogo [pedronauck/skills](https://github.com/pedronauck/skills)
(130 skills) selecionou 13 relevantes para o Batuta. O padrão que emergiu:
quase nada é "instalar e usar" — várias dependem do ecossistema Compozy do
autor ou competem com o que o Batuta já faz. O valor está em **destilar
contratos e checklists para dentro das skills do próprio Batuta**, respeitando
o teto de peso do ciclo (cada linha de skill custa contexto em toda tarefa).

Skills analisadas na íntegra: `to-prompt`, `agent-output-audit`, `deslop`,
`no-workarounds`, `adversarial-review`, `impl-peer-review`, `spec-peer-review`,
`deep-review`, `agent-exploration`, `herdr-orchestration`, `testing-boss`,
`qa-report`, `qa-execution`, `writing-agents-md`, `writing-skills`.

## Proposta — quatro ondas, por prioridade

### Onda 1 — Verify anti-fraude (Step 4 do ciclo)

Ataca a dor real registrada em uso: o executor **declara** completo, mas o
diff não sustenta a declaração (sintoma-raiz dos commits atômicos falhos).

Fonte: `agent-output-audit` (princípio "self-report não é evidência",
red flags RF-1..RF-6, vocabulário `declared` vs `verified`) + `deslop`
(5 alvos de slop).

1. **Scans de higiene de teste no diff review** — greps baratos sobre o diff
   antes do veredito, quando a tarefa toca testes:
   - teste pulado/desabilitado adicionado (`.skip`, `.only`, `xit`,
     `@pytest.mark.skip`) → falha automática;
   - assertion estrita trocada por permissiva (`toBe` → `toBeTruthy` e
     equivalentes) no mesmo diff → falha em critério de aceite;
   - mock novo escondendo dependência que o critério pedia real → falha;
   - snapshot/golden file atualizado sem requisito que justifique → falha;
   - cobertura só de caminho feliz quando o critério nomeia caso de erro →
     feedback ao executor (não falha automática).
2. **Regra "declarado ≠ verificado"** — o relato do executor nunca conta como
   evidência; todo critério de aceite é conferido re-executando a menor prova
   pública (teste, comando, request).
3. **Checklist de slop no diff review** — comentários desnecessários, checks
   defensivos anormais, `any`/casts para calar tipo, nesting que pede early
   return, padrão inconsistente com o arquivo ao redor. Achou → feedback ao
   executor junto com o retry normal do ciclo (não é passo novo).

Onde (decidido em conversa, 2026-07-26): arquivo central dormante
`verification.md` na raiz, no padrão `superpowers.md`/`codex-plugin.md` —
Step 4 e `skills/review/SKILL.md` ganham ponteiros curtos. Scans em forma
**descritiva** (padrões nomeados; o maestro adapta o grep à stack), não
comandos literais. Severidade: itens 1–4 dos scans = falha de verificação;
caminho feliz apenas = feedback no retry.

### Onda 2 — Brief endurecido (Step 2 do ciclo)

Fonte: `to-prompt` (tese "brief carrega o quê, não o como"), delegation
packet do `herdr-orchestration`, `no-workarounds` (7 sinais), Iron Laws do
`testing-boss`.

1. **Duas seções novas no brief**, vindas do delegation packet:
   - **Evidência esperada** — o que o executor deve reportar de volta:
     arquivos tocados, comandos rodados com resultado, incerteza declarada.
     Alimenta a Onda 1 (dá ao verify algo concreto para conferir).
   - **Stop conditions** — quando o executor deve parar e reportar em vez de
     improvisar: forma de código inesperada, falha repetida de comando,
     necessidade de editar fora do escopo (Boundaries já existe; isto é o
     complemento comportamental).
2. **Regra anti-workaround no brief** — destilação dos 7 sinais em ~4 linhas:
   proibido calar sinal em vez de consertar fonte (`as any`/`@ts-ignore`,
   catch vazio, `setTimeout` para corrigir ordem, copiar-e-ajustar código
   similar). Exceção só com marcação `// WORKAROUND:` + justificativa no
   relato — que o verify então julga.
3. **Iron Laws quando a tarefa envolve testes** (~3 linhas): teste o
   comportamento, nunca o mock; teste falhou → conserte produção primeiro;
   nenhum flag/branch test-only em código de produção.
4. **Sweep de soluções vazadas** — releitura do brief deletando "como"
   disfarçado de requisito. **Adaptação consciente:** vale para lanes
   média/complexa (modelo capaz escolhe o caminho); nas lanes baratas o
   Batuta prescreve de propósito — a regra não se aplica lá.
5. **Lacuna explícita** — seção do brief sem conteúdo ganha
   `Desconhecido — <motivo>` em vez de sumir (lacuna silenciosa lê como
   "nada a dizer").

Onde (decidido na entrega, 2026-07-26): itens 1, 3, 4 e 5 no Step 2 de
`skills/batuta/SKILL.md` (duas seções novas do brief, leis de teste
condicionais — só quando os critérios envolvem testes —, sweep e regra do
`Unknown`). Item 2 (anti-workaround) em `templates/generic.md`: entrada no
bloco `Never:` (anti-padrão objetivo, visível no diff — a filosofia do
bloco) + hint de verificação julgando marcadores `// WORKAROUND:`; a hint
de swallowed errors existente foi absorvida pela nova (sem duplicação).

### Onda 3 — Cross-review com desenho melhor (Step 4 / `/batuta:review`)

Fonte: `adversarial-review`, `impl-peer-review`/`spec-peer-review`.

1. **Escala de reviewers por tamanho do diff** — pequeno (<50 linhas): 1
   lente; médio: 2; grande (200+): 3. Lentes nomeadas: **Cético** (o que
   quebra?), **Arquiteto** (encaixa no desenho?), **Minimalista** (o que
   sobra?).
2. **Julgamento do maestro** — após o cross-review, o maestro aceita/rejeita
   cada achado com rationale de uma linha. Reviewer adversarial produz falso
   positivo por design; achado aceito = falha de verificação, achado
   rejeitado = registrado e ignorado. (Hoje "valid findings count as
   verification failure" — quem decide a validade fica explícito.)
3. **Paridade de contrato** — quando o item implementa um spec, o material
   de review carrega os artefatos do spec, nunca paráfrase. (Incidente real
   documentado na fonte: 7 rounds de SHIP num entregável que contradizia o
   spec porque nenhum round recebeu o documento canônico.)
4. **Findings como artefato, não prosa** — o reviewer externo escreve
   arquivo de findings; stdout é evidência operacional. Round sem arquivo =
   round inválido. Alinha com a direção orquestrador-agnóstico: o contrato é
   o arquivo, não o transporte.

Onde (decidido na entrega, 2026-07-26): contrato completo em seção
"Cross-review contract" do `verification.md` (vale para qualquer
transporte — alinhado à direção agnóstica); `codex-plugin.md` (linha de
cross-review), Step 4 e `skills/review/SKILL.md` só apontam. Duas
adaptações conscientes: (a) a escala vira número de **lentes numa única
despacha** (1–3 conforme o diff), não N reviewers paralelos — o v1 tem um
Codex só; (b) o arquivo de findings fica **fora do repo**, para não
colidir com a guarda read-only que o cross-review aplica (`git status`
limpo é parte do contrato da despacha).

### Onda 4 — Protocolo de QA para a retrô do cobaia (não entra no ciclo)

Fonte: `qa-execution`/`qa-report`. Adotar o par inteiro seria scope creep
para o v1; a destilação vira o **roteiro da retrô** no projeto cobaia:

1. **Três inegociáveis da sessão:** in persona (usar o Batuta como usuário,
   sem espiar implementação para decidir o que "deveria" acontecer); prova,
   não otimismo (Pass = observável confirmado por caminho independente);
   write back ou não aconteceu (todo achado registrado com evidência).
2. **Stall é finding** — travada, commit não-atômico, estado perdido: cada
   um vira registro com evidência, nunca algo a contornar na sessão.
3. **Rubrica de impacto em 5 níveis** centrada no usuário como vocabulário
   de severidade dos achados.
4. **Jornadas do Batuta** como unidade da retrô: `init → ciclo simples`,
   `ciclo com decomposição`, `falha → escalada`, `pause → resume`,
   `worktree por tarefa`.

Onde: documento de retrô no cobaia (fora deste repo), guiado pelos critérios
do PRD §8. Reavaliar o par completo como camada de QA pós-ciclo só depois do
v1.

## Meta — skills de autoria (fora do ciclo, dentro da oficina)

Fonte: `writing-agents-md` (o "rent test") e `writing-skills` (doutrina de
predictability). Não entram no ciclo do Batuta — governam como o Batuta e
seus artefatos são escritos.

1. **Rent test para o conteúdo que o Batuta injeta em todo brief.** A física
   do `writing-agents-md` ("todo contexto residente taxa toda sessão; regras
   se diluem mutuamente") vale identicamente para profile + templates, que
   entram em toda delegação. Destilar o teste triplo — **delta** (muda o que
   o executor faria?), **frequência** (importa na maioria das tarefas?),
   **economia** (residente sai mais barato que descobrir na hora?) — como
   critério declarado no `batuta:init` para gerar/editar o profile e como
   racional documentado do teto de ~35 linhas dos templates. Bônus da mesma
   fonte: ênfase (NEVER, caps) reservada a 1–2 regras catastróficas —
   "ênfase em tudo é ênfase em nada" — regra direta para os blocos `Never:`
   dos templates.
2. **`writing-skills` como doutrina de manutenção do próprio Batuta.** As
   skills do Batuta são o produto; a doutrina (hierarquia de informação,
   progressive disclosure, leading words, caça a no-ops e sediment) é o
   guia de estilo para escrevê-las e podá-las. Uso: adotar como referência
   de oficina — consultada ao editar `skills/*` — não como dependência.
   Nota: complementa (não substitui) a `superpowers:writing-skills` já
   instalada; a versão do Pedro tem a doutrina de predictability e o
   glossário de failure modes (premature completion, sediment, no-op,
   negation) que a outra não cobre.

## Conceitos avulsos (adotar quando o contexto aparecer)

- **Linter-overlap** (`deep-review`): rodar o linter do projeto antes do diff
  review e não reportar o que ele já pega — review gasta atenção no que só
  review acha.
- **Veredito mecânico** (`deep-review`): veredito derivado dos achados por
  regra declarada (qualquer achado aceito = falha), nunca por "sentimento".

## Descartes conscientes

| Skill | Razão |
|---|---|
| `impl/spec-peer-review`, `agent-exploration` como instalação | Hard dependency no Compozy (CLI do autor); só o design foi aproveitado |
| `herdr-orchestration` como instalação | Depende da ferramenta `herdr`; delegation packet destilado na Onda 2 |
| `deep-review` completo | Pipeline industrial (6 scripts, manifests) — pesado demais para o ciclo por-tarefa |
| `qa-report`/`qa-execution` completos | Árvore própria + ~10 references; destilado na Onda 4, reavaliar pós-v1 |
| `agent-exploration` (conteúdo) | Confirma o desenho do batedor; nada novo a adicionar |
| `a11y-testing`, `agent-browser` | Específicos de produto web; fora do escopo do Batuta em si |

## Critérios de aceite da proposta

- Cada onda implementável como um ciclo Batuta próprio (commit atômico por onda).
- Nenhuma onda adiciona fase nova ao ciclo — tudo entra como regra dentro de
  Step 2/Step 4/review existentes.
- Peso: Ondas 1–3 somadas devem caber em ~40 linhas líquidas de skill; o que
  passar disso vai para os templates ou para um reference.
- README registra o pedronauck/skills como inspiração (feito junto desta spec).
