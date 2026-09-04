# Superfície de comandos — init, pause e resume

**Data:** 2026-07-20 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

Três dores na superfície de comandos atual:

1. O skill principal (`/batuta`) acumula onboarding + ciclo. O onboarding
   implícito funciona na primeira vez, mas não existe comando para
   *reconfigurar* um projeto já onboardado ("instalei o codex agora, quero
   remapear a lane") — hoje só editando arquivo ou via route, que cobre apenas
   a tabela.
2. Não existe pausa/retomada explícita entre sessões. O `WORK.md` diz *o quê*
   estava em andamento, mas não *onde no ciclo* a sessão parou nem o que foi
   decidido na conversa e ainda não virou código.
3. A superfície real não bate com a documentada: comando de plugin é
   `plugin:skill`, os skills se chamam `batuta-plan`, `batuta-status` etc., e
   os comandos reais são `/batuta:batuta-plan`… — enquanto o README documenta
   `/batuta:plan`. O prefixo de plugin é opcional sem conflito de nome, então
   `/batuta` (skill `batuta`) funciona; os demais precisam de rename.

## Decisões (tomadas em conversa)

1. **`init` = onboarding + reconfiguração, e é o único caminho** — `/batuta`
   num projeto sem perfil aponta para `/batuta:init` e para. `/batuta` fica
   específico para entender o que o dev quer (o ciclo).
2. **`pause` = handoff de sessão** — além de deixar o `WORK.md` honesto,
   escreve `.batuta/handoff.md` com o que o `WORK.md` não carrega. O handoff é
   nota de passagem: consumido e apagado no resume.
3. **`resume` explícito, com detecção no `/batuta`** — handoff pendente faz o
   `/batuta` avisar em uma linha e perguntar (retomar ou seguir com o novo
   pedido); nunca auto-resume.
4. **Renames** — `batuta-plan`→`plan`, `batuta-status`→`status`,
   `batuta-route`→`route`, `batuta-review`→`review`. O principal continua
   skill `batuta`, documentado como `/batuta`. Breaking rename aceito (0.x,
   fase de teste, um usuário; CHANGELOG avisa).

## Desenho

### Skill `init` (novo, `skills/init/SKILL.md`, inglês)

Dois modos, decididos pela existência de `.batuta/profile.md`:

- **Primeira execução:** o Step 0 atual do skill principal, movido íntegro —
  detecção de stack, 3–5 perguntas, `profile.md` com referência a template,
  mapa do projeto (sweep adiado para o fim, delegado ao batedor), takeover de
  outro framework, checagem de executores + mapeamento de lanes (incluindo a
  lane Research) numa única pergunta de confirmação, `WORK.md` criado.
- **Reconfiguração:** re-roda as checagens de disponibilidade dos adapters
  referenciados pela tabela, mostra o mapeamento e o perfil atuais e pergunta
  o que mudar — lane/modelo, respostas do perfil, re-sweep do mapa. Reescreve
  só o que mudou. Nunca toca `WORK.md`. Princípio do adapter dormente
  preservado (só checa o que a tabela referencia; CLI novo entra quando o
  usuário pede).

### Skill `pause` (novo, `skills/pause/SKILL.md`, inglês)

1. Atualiza `WORK.md`: tarefa em voo ganha estado real ("delegada ao codex,
   aguardando verificação").
2. Background tasks: anota as que seguem rodando, encerra as órfãs.
3. Escreve `.batuta/handoff.md` em prosa, 4 seções:
   - **Ponto do ciclo** — onde exatamente parou ("brief pronto, faltou delegar").
   - **Decisões não escritas** — o que foi decidido na conversa e ainda não
     virou código/perfil.
   - **Background** — executores rodando/pendentes e o que fazer com eles.
   - **Pendências com o usuário** — perguntas abertas.

### Skill `resume` (novo, `skills/resume/SKILL.md`, inglês)

1. Lê `profile.md` + `routing.md` + `WORK.md` + `handoff.md` (se existir).
2. Confere o estado do git: branch atual, árvore suja, últimos commits.
3. Resume a situação em poucas linhas e confirma com o usuário.
4. Retoma do ponto exato do ciclo. O que o handoff carregava é absorvido no
   `WORK.md`; o `handoff.md` é **apagado**. Sem handoff, retoma só do
   `WORK.md` e diz isso explicitamente.

### Skill principal emagrece

O Step 0 sai inteiro (vira o skill `init`). Entram dois gates no topo:

- Sem `.batuta/profile.md` → "run `/batuta:init` first" e para.
- `.batuta/handoff.md` existe → uma linha: "paused work from \<date\>:
  `/batuta:resume` to pick it up, or I continue with the new request" — e
  obedece a escolha.

O restante (classificar → brief → delegar → verificar → commitar, batedor,
princípios) permanece. A description do frontmatter reflete o novo papel
(ciclo + gates, sem onboarding).

### Renames

`git mv` dos diretórios: `skills/batuta-plan`→`skills/plan`,
`batuta-status`→`status`, `batuta-route`→`route`, `batuta-review`→`review`,
ajustando o `name:` no frontmatter de cada um. Superfície final: `/batuta` +
`/batuta:init|plan|pause|resume|status|route|review` — 8 comandos.

### Referências cruzadas

- `routing.md` e seção "The scout" do skill principal citam "Step 0.4/0.6" do
  onboarding → passam a citar o skill `init`.
- README: tabela de comandos (8 linhas), seção de onboarding reescrita em
  torno do `/batuta:init` (inclusive reconfiguração), menção a pause/resume.
- PRD: §6.1 (onboarding via init, incluindo modo reconfiguração), §6.7
  (comandos), nova seção curta para pause/resume/handoff, e nova linha no §9
  registrando a revisão da decisão "Comandos: 5" (a linha antiga permanece —
  o §9 é histórico).

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `skills/init/SKILL.md` | novo — onboarding movido + modo reconfiguração |
| `skills/pause/SKILL.md` | novo — WORK.md honesto + handoff |
| `skills/resume/SKILL.md` | novo — leitura de estado + retomada + consumo do handoff |
| `skills/batuta/SKILL.md` | Step 0 removido, gates adicionados, description e referências ao batedor atualizadas |
| `skills/batuta-{plan,status,route,review}` | renomeados para `plan`, `status`, `route`, `review` (dir + frontmatter `name:`) |
| `routing.md` | referência de onboarding aponta para o skill `init` |
| `README.md` | comandos, onboarding, pause/resume |
| `docs/PRD.md` | §6.1, §6.7, seção pause/resume, linha no §9 |

## Fora de escopo (YAGNI)

- Auto-resume (o `/batuta` nunca retoma sozinho).
- Múltiplos handoffs / workstreams paralelos — um handoff por projeto.
- Migração/aliases para os nomes antigos de comando — o CHANGELOG do release
  avisa a quebra.
- Mudanças nos conteúdos de plan/status/route/review além do rename.
