# Integração com o impeccable — polimento de frontend quando disponível

**Data:** 2026-07-26 · **Status:** proposta, aguardando discussão

## Problema

Tarefas de frontend delegadas a executor barato saem funcionais mas
visualmente genéricas ("AI slop"): hierarquia fraca, estados de erro/vazio
esquecidos, acessibilidade abaixo do piso. Os templates de stack (react,
nextjs, vue…) garantem convenção de código, não qualidade de design. O
plugin impeccable — quando instalado na sessão — carrega exatamente esse
músculo (heurísticas de usabilidade, pisos de a11y, anti-padrões nomeados,
disciplina de design system), mas o Batuta hoje não o consulta.

## Proposta

Terceiro companion no padrão consolidado (`superpowers.md`,
`codex-plugin.md`): documento central dormante **`impeccable.md`** na
raiz; skills apontam em uma linha; detecção em runtime (skill `impeccable`
presente na sessão); ausente → ciclo idêntico ao baseline. Autoridade
inalterada: o impeccable fornece método e rubrica; roteamento, veredito e
commit seguem do maestro.

**Gate de ativação (controle de custo):** o impeccable é uma skill pesada
em contexto. Só é consultado quando a tarefa é **UI voltada a usuário**
(novo componente/tela/fluxo visual — não config, não lógica, não teste) e
a lane é **média ou acima**, ou quando o usuário pede polimento
explicitamente ("capricha no visual"). Tarefa trivial de frontend (ajuste
de texto, prop, estilo pontual) nunca ativa — o template da stack basta.

Mapa — momento do ciclo → papel do impeccable:

| Momento | Papel | O que o Batuta mantém |
| --- | --- | --- |
| Brief (Step 2) | Direção de design no brief: hierarquia, estados (loading/vazio/erro), piso de a11y, anti-padrões vetados para a tela em questão — destilados pelo maestro em ~5-10 linhas de critérios verificáveis; o brief nunca embute a skill inteira | Estrutura do brief; template da stack como base; autossuficiência (o executor não tem o impeccable — recebe critérios, não a skill) |
| Verificação (Step 4) | Lente de design no diff review: os critérios de design do brief são conferidos como qualquer critério de aceite; achados de slop visual entram no feedback do retry | Scans e regras do `verification.md`; veredito do maestro |
| Execução na lane claude (crítica) | O maestro executa a tarefa de UI conduzido pelo impeccable diretamente — único caso em que a skill roda inteira, pois o executor é o próprio maestro | Test-first via superpowers quando instalado; ciclo inalterado |
| `/batuta:review` de diff de UI | Auditoria com a rubrica do impeccable quando o usuário pede review de frontend | Formato de veredito da skill review |

**Princípio-chave — critérios atravessam, skill não:** executores baratos
não têm o impeccable do lado deles. A integração funciona porque o maestro
destila a rubrica em critérios de aceite verificáveis dentro do brief
(mesmo mecanismo das convenções de stack), e verifica contra eles no Step
4. O impeccable potencializa o brief e a verificação — nunca vira
dependência do executor.

## Fronteiras

- Detecção só em runtime, sem toggle, sem varredura (padrão dos companions).
- Ausente → templates de stack seguem sendo a única fonte de convenção de
  UI; nenhuma linha do ciclo muda.
- O gate de ativação é regra do `impeccable.md`, não do SKILL.md — as
  skills só apontam.
- Browser/screenshot ao vivo (parte pesada do impeccable) fica fora do v1
  da integração: a lente de verificação é sobre o diff e os critérios, não
  sobre render — reavaliar quando houver worktree + dev server padronizado.

## Critérios de aceite

- Com impeccable instalado: tarefa média+ de UI ganha bloco de critérios
  de design no brief e a lente correspondente na verificação; trivial não
  ganha nada.
- Sem impeccable: diff do ciclo vazio (nenhum comportamento muda).
- Peso: ponteiros nas skills ≤ ~6 linhas somadas; todo o detalhe vive em
  `impeccable.md`.
- PRD §9 registra a decisão; §5 (critério "funciona com e sem plugins")
  passa a citar os três companions.
