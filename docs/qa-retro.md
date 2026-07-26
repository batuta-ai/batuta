# Protocolo de retrô — QA de uso real do Batuta

Roteiro reusável para as rodadas de teste do Batuta num projeto cobaia.
Operacionaliza os critérios de sucesso do PRD §8 como sessões de dogfooding:
uma persona (você, dev usando o Batuta de verdade) caminha jornadas
completas e registra o que um usuário real experimentaria. O protocolo mora
aqui e é versionado com o Batuta; os **resultados** de cada rodada (achados,
vereditos, debrief) pertencem à sessão de retrô e ficam com o cobaia.

Destilado de `qa-execution`/`qa-report` do
[pedronauck/skills](https://github.com/pedronauck/skills) — ver a spec de
destilação em `docs/superpowers/specs/`.

## Os três inegociáveis da sessão

1. **In persona** — toda interação passa pela superfície pública do Batuta
   (comandos, briefs, WORK.md, commits). Proibido espiar a implementação
   das skills para decidir o que "deveria" acontecer, proibido contornar
   um travamento por dentro. O que a persona não alcança, o usuário real
   também não alcança.
2. **Prova, não otimismo** — um Pass exige o observável esperado confirmado
   por caminho independente: o commit existe e é atômico (`git log`), o
   WORK.md tem a linha, o diff rastreia ao pedido. O Batuta *dizer* que fez
   não é confirmação — é exatamente a regra do `verification.md` aplicada
   ao próprio Batuta.
3. **Write back ou não aconteceu** — todo achado vira registro na sessão
   (com evidência: comando, saída, hash) antes de seguir adiante.

## Stall é finding

Travada, pergunta que não devia existir, commit não-atômico, estado
perdido no resume, brief que o executor não entendeu: cada um é um achado
a registrar com evidência — nunca algo a empurrar, re-prompted ou
consertar na hora para "continuar o teste". Consertar no meio da sessão
contamina a rodada; o fix vem depois, pelo ciclo normal, no repo do Batuta.

## Jornadas a caminhar

Toda rodada cobre as jornadas tocadas pelas mudanças desde a rodada
anterior, mais uma adjacente como canário. Rodada de release cobre todas:

| # | Jornada | Estado final verdadeiro |
|---|---|---|
| J1 | `init` → primeiro ciclo simples | tarefa trivial delegada e commitada com < 3 interações (PRD §8.1) |
| J2 | Ciclo com decomposição | pedido-lista vira N ciclos e N commits atômicos, não um commitzão |
| J3 | Falha → retry → escalada | feedback específico no retry; escalada sobe uma linha da tabela; diagnóstico enriquece o re-brief |
| J4 | `pause` → sessão nova → `resume` | trabalho retomado só com os arquivos, sem contexto extra (PRD §8.4) |
| J5 | Worktree por tarefa | main limpo durante a execução; squash com mensagem do maestro; worktree removido |
| J6 | Verificação endurecida | executor que declara sem evidência é pego; scan de higiene de teste dispara quando provocado |

Cada jornada caminha até o **estado final verdadeiro** — não até "parece
que funcionou". Inclui pelo menos um caminho de abandono por rodada
(ex.: rejeitar um plano, cancelar no meio do ciclo).

## Rubrica de impacto (severidade dos achados)

| Tier | Significado para o usuário |
|---|---|
| 1 — Bloqueia | a jornada não termina; sem contorno em persona |
| 2 — Perde trabalho | estado/commit/diff perdido ou corrompido |
| 3 — Quebra confiança | o Batuta afirma algo que a evidência contradiz |
| 4 — Atrito | a jornada termina, mas custou interações ou confusão a mais |
| 5 — Paper cut | incômodo que nenhum critério formal pega; registrar mesmo assim |

## Registro de achado (formato mínimo)

```markdown
### <slug curto> — tier N
Jornada: J<n> · Rodada: <data>
O que aconteceu: <1-3 frases, em persona>
Evidência: <comando + saída, hash, trecho de WORK.md>
Esperado: <o que o usuário esperava ver>
```

Dedup antes de registrar: achado re-encontrado de rodada anterior soma à
entrada existente ("re-found"), não vira achado novo.

## Fechamento da rodada

- Toda jornada em escopo tem veredito (Pass / achados / bloqueada — com o
  pré-requisito exato que faltou). Cortou jornada por falta de janela?
  Corta por risco (tier 1 primeiro) e **declara o corte** — cobertura
  encolhe visivelmente ou não encolhe.
- Status final: pronto ou não para a próxima versão, com totais por tier.
- Os achados viram trabalho no repo do Batuta pelo ciclo normal (um fix =
  um ciclo = um commit), priorizados por tier.
