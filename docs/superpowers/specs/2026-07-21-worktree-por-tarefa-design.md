# Worktree por tarefa — executor isolado, integração pelo maestro

**Data:** 2026-07-21 · **Status:** aprovado em conversa, aguardando plano de
implementação · **Sequência:** implementar após a integração com superpowers
(`2026-07-21-integracao-superpowers-design.md`), que é pré-requisito conceitual.

## Problema

Hoje o executor escreve direto no checkout principal: trabalho rejeitado exige
revert manual, o estado do main fica sujo durante o ciclo, e o loop de
retry/escalação desfaz edições em vez de descartar um branch. Worktree só
aparece no modo paralelo — sequencial e paralelo seguem mecanismos diferentes.

## Decisões (tomadas em conversa)

1. **Executor trabalha em worktree próprio** — commita livremente lá (WIP);
   falha ou descarte = deletar o worktree, o main nunca fica sujo.
2. **Maestro revisa no worktree e integra** — o Step 4 roda sobre o branch do
   worktree; ajustes voltam ao executor no mesmo worktree; na aprovação, o
   maestro faz **squash no main escrevendo a mensagem** conforme a metodologia
   do profile. Autoridade do commit continua com o Batuta ("Batuta manda").
3. **Configurável no profile, gate por lane como default** — linha
   `Worktree: off | medium+ | always` no `.batuta/profile.md`, default
   `medium+`: trivial roda no checkout principal (worktree para trocar uma
   string é cerimônia demais), medium para cima vai de worktree. Perguntado no
   `/batuta:init` (primeira configuração) e ajustável no reconfigure. Override
   verbal por pedido continua valendo.
4. **Um mecanismo só** — com worktree ativo, sequencial e paralelo usam o
   mesmo caminho; o paralelo deixa de ser o único caso com worktree.

## Desenho

### Ciclo com worktree (modo `medium+` ou `always`)

1. **Step 3 — Delegar:** o maestro cria worktree + branch por tarefa
   (`.batuta/worktrees/<slug>/`, branch `batuta/<slug>`) e invoca o executor
   com o worktree como diretório de trabalho. O executor commita como quiser
   (WIP); a granularidade dele não importa.
2. **Step 4 — Verificar:** diff review sobre o branch
   (`git diff main...batuta/<slug>`), testes rodando dentro do worktree,
   critérios do brief item a item. Reprovado → feedback específico ao executor
   no mesmo worktree (1 retry). Escalação → reset do branch, re-brief, próximo
   executor no mesmo worktree.
3. **Step 5 — Integrar:** aprovado → o maestro faz squash-merge no main e
   escreve a mensagem do commit (metodologia do profile). Um task verificado =
   um commit no main, como hoje. Worktree e branch são removidos após a
   integração. Registro no `WORK.md` inalterado.
4. **Falha definitiva (pós-escalação):** worktree e branch deletados; em
   batch, itens dependentes bloqueados como no Step 1.5 atual.

### Ambiente de testes no worktree

A dor prática número um: rodar testes exige dependências no worktree
(node_modules, venv, build). Regra pragmática:

- O maestro tenta o comando de teste do profile direto no worktree.
- Falhou por ambiente (dependência ausente, não teste vermelho) → roda o
  comando de instalação do profile (nova linha opcional `Install:` no
  profile, perguntada no init junto com o modo worktree) e tenta de novo.
- Sem comando de instalação e ambiente quebrado → degrada: informa e roda os
  testes no checkout principal após aplicar o diff (fallback declarado, nunca
  silencioso).

### Interação com regras existentes

- **Scout read-only guard:** inalterado no checkout principal; scouts nunca
  rodam dentro de worktrees de executores.
- **Modo `off`:** comportamento atual palavra por palavra — executor no
  checkout principal, commit direto pelo maestro. É o baseline de degradação.
- **Paralelo:** com worktree ativo, o paralelismo do Step 3 usa o mesmo
  mecanismo (um worktree por executor já era a regra); verify/integração por
  item, conforme cada executor retorna.
- **Superpowers:** quando instalado, `using-git-worktrees` conduz a criação e
  limpeza; `subagent-driven-development` conduz o loop implementador→revisor.
  Ausente → git nativo, mesmos passos.

### Pontos de contato

- `skills/batuta/SKILL.md` — Steps 3, 4 e 5 ganham o caminho worktree
  condicionado à linha do profile; Step 1.5 menciona que o modo vale por item.
- `skills/init/SKILL.md` — pergunta do modo worktree (default `medium+`) e da
  linha `Install:` no onboarding e no reconfigure.
- `README.md` e `docs/PRD.md` — documentar o fluxo e registrar a decisão
  (tabela §9), mantendo consistência PT-BR × EN.

## Fora de escopo

- Nenhuma mudança nos adapters (o diretório de trabalho é parâmetro de
  invocação, não regra do adapter).
- Nenhuma mudança no scout/lane de research.
- Nenhum merge commit ou preservação do histórico WIP do executor — squash
  sempre.

## Critérios de aceite

1. Profile suporta `Worktree: off | medium+ | always` (default `medium+`) e a
   linha opcional `Install:`; init pergunta ambos, reconfigure permite mudar.
2. Com modo ativo, o ciclo cria worktree por tarefa, verifica no branch e
   integra por squash com mensagem do maestro; worktree removido ao final.
3. Com modo `off`, nenhuma skill muda de comportamento.
4. Falha de ambiente de teste no worktree segue a cadeia declarada
   (instalar → fallback no checkout principal → nunca silencioso).
5. README e PRD documentam o fluxo de forma consistente com as skills.
