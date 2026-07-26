# Plan como spec-pipeline opcional — IDEIA → PRD → TECHSPEC → TASKS

**Data:** 2026-07-26 · **Status:** proposta, aguardando discussão

## Problema

O ciclo do Batuta cobre bem a metade de baixo da esteira que ferramentas
como o Compozy oferecem (tasks independentes → execução com contexto →
review → commit), com duas vantagens que a esteira não tem: roteamento por
custo e commit atômico por item verificado. O que falta é a metade de cima —
transformar uma ideia em linguagem natural num PRD curto e num techspec
antes de virar tasks — para pedidos greenfield ou features grandes, onde
"2-3 perguntas inline" é pouco e o usuário quer artefatos revisáveis.

O risco a evitar é o documentado na fundação do projeto: fases obrigatórias
e artefatos de planejamento para qualquer tarefinha são exatamente o
extremo "pesado demais" contra o qual o Batuta existe. A garantia é "plano
quando precisa", nunca esteira fixa.

## Proposta

O spec-pipeline é um **modo do `/batuta:plan`**, não um comando novo nem
uma fase do ciclo:

1. **Ativação** — só em dois casos: o usuário pede ("quero specar", "faz um
   PRD disso"), ou o `/batuta:plan` detecta porte greenfield/multi-sessão
   com ambiguidade alta e **oferece** o modo ("isso renderia um spec antes
   do plano — quer?"). Nunca automático, nunca para tarefa que cabe no
   ciclo direto. O plan formal atual permanece o default do comando.
2. **Estágios** — quando ativo, o plan conduz:
   - **IDEIA** → conversa: o pedido em linguagem natural + as perguntas
     que faltam (com superpowers, `brainstorming` conduz).
   - **PRD curto** → o quê e por quê: problema, usuários, requisitos,
     critérios de sucesso, não-objetivos. Prosa, 1-2 telas no máximo.
   - **⏸ Gate 1: usuário aprova o PRD** (o "quê" congela antes do "como").
   - **TECHSPEC** → como: arquitetura da solução, decisões com motivo,
     riscos, impacto no código existente (mapa do profile alimenta).
   - **TASKS** → o techspec fatiado em unidades de commit atômico, cada
     uma com lane prevista pela tabela de roteamento e critérios de
     aceite — o formato de plano que já existe hoje.
   - **⏸ Gate 2: aprovação do plano** (o gate atual do `/batuta:plan`).
3. **Artefato** — um diretório `.batuta/spec-<slug>/` com `prd.md`,
   `techspec.md` e o `plan-<slug>.md` atual (movido para dentro quando o
   modo spec está ativo; sozinho em `.batuta/` no modo default, como hoje).
   Prosa + checkboxes, sem schema rígido; retomável por sessão nova a
   partir dos arquivos.
4. **Execução** — as tasks caem no ciclo normal (Step 1.5 em diante), uma
   a uma: brief → delegação roteada → verificação endurecida → commit.
   Nada do ciclo muda; o pipeline só produz tasks melhores.
5. **Sinergia com a Onda 3 (paridade de contrato)** — o `techspec.md` é o
   artefato de contrato que o cross-review dos itens complex/critical
   recebe verbatim (`verification.md`, cross-review contract). O pipeline
   fecha o circuito: quem gerou o contrato também o entrega ao reviewer.
6. **Memória (estágio 7 do Compozy): não-objetivo declarado.** O
   equivalente do Batuta segue sendo `WORK.md` + mapa oportunista do
   profile — prosa alimentada como efeito colateral do ciclo. Nenhuma fase
   de "compactar contexto"; a lição do GSD (schema rígido quebra) vale
   dobrado para memória estruturada.

## Fronteiras

- Escrita: tudo em `.batuta/` (fronteira de escrita existente).
- O modo spec nunca é pré-requisito: pedido claro continua indo direto ao
  ciclo, ambíguo pequeno continua com perguntas inline.
- PRD/techspec são artefatos do *trabalho*, não do produto Batuta — não
  confundir com `docs/PRD.md` do repo.
- Superpowers ausente → o plan conduz os estágios com o texto baseline da
  skill (mesma degradação dos demais).

## Critérios de aceite

- `/batuta:plan` sem modo spec: comportamento idêntico ao atual.
- Modo spec produz os 3 artefatos com os 2 gates e termina no plano
  aprovado alimentando o ciclo normal.
- Sessão nova retoma o pipeline de qualquer estágio só com os arquivos.
- Peso: a skill `plan` cresce ≤ ~25 linhas; o detalhe de condução dos
  estágios, se passar disso, vai para um reference dormante.
