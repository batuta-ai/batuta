# Batedor — lane de pesquisa delegada a modelos baratos

**Data:** 2026-07-20 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

Hoje quem paga a pesquisa de arquivos é o maestro (modelo caro da sessão), em
três momentos: o sweep do Project map no onboarding (Step 0.4 — o SKILL.md
promete "delegable to a cheap executor" sem definir mecanismo), a montagem da
seção Context do brief (Step 2 — o caso recorrente e mais caro) e perguntas
ad-hoc do usuário sobre a base. Cada arquivo lido entra no contexto premium da
sessão.

Pesquisa difere das lanes existentes em natureza: é read-only, o output é um
relatório consumido pelo maestro (não um diff verificável por testes), e o modo
de falha é silencioso — pesquisa errada vira brief errado ou resposta errada ao
usuário sem nenhum teste quebrar.

## Decisões de escopo (tomadas em conversa)

1. **Motivação dominante:** custo (CLI barato externo) e velocidade
   (background/fan-out). Economia de contexto vem como bônus do destilado.
   Mecanismo via CLI mantém o desenho agnóstico ao orquestrador — não usar o
   agente Explore nativo do Claude Code como mecanismo primário.
2. **Escopo:** conceito completo — sweep de onboarding, pesquisa pré-brief e
   perguntas ad-hoc do usuário. O batedor é conceito de primeira classe.
3. **Representação:** segunda tabela em `routing.md` ("Support lanes"),
   separada da escada de complexidade. Sem escalação em escada: o fallback é o
   maestro assumir.
4. **Verificação:** estrutural barata — paths via `ls`, símbolos via `grep`.
   1 retry com feedback; segunda falha → maestro pesquisa ele mesmo.

## Desenho

### Conceito

O batedor é um papel de apoio: executor barato, read-only, que responde
perguntas sobre a base e devolve relatório estruturado que o maestro consome
sem abrir os arquivos. Nunca escreve código, nunca commita, não entra no
WORK.md.

### Roteamento

`routing.md` ganha uma segunda tabela:

```markdown
## Support lanes

| Role | Examples | Executor | Cost |
|---|---|---|---|
| Research | project map sweep, brief context, "where does X live?" | <CLI + cheap model> set at onboarding (e.g. kimi, haiku, small codex model) | cents |
```

Regras próprias, documentadas junto à tabela:

- **Sem escada:** scout falhou 2× (original + 1 retry) → o maestro pesquisa
  ele mesmo. Executor indisponível → idem.
- **Modelo explícito** na linha, igual à lane trivial (discovery via adapter,
  confirmado no onboarding; a tabela default carrega placeholder).
- **Adapter dormente preservado:** só o adapter referenciado pela linha é lido.

### Protocolo do batedor (seção nova em `skills/batuta/SKILL.md`)

- **Research brief:** pergunta(s) objetivas, pontos de partida vindos do
  Project map, boundaries (ignorar `node_modules`, arquivos gerados, etc.) e o
  formato de relatório obrigatório — modelo pequeno segue formato literal,
  então o contrato viaja no brief sempre.
- **Contrato do relatório**, 4 seções fixas:
  - `Resposta` — prosa curta que responde a pergunta.
  - `Arquivos` — `path:linha — por que importa`, um por linha.
  - `Evidência` — snippets mínimos que sustentam a resposta.
  - `Incertezas` — o que não foi encontrado ou ficou ambíguo. Seção
    obrigatória: é o escape honesto que reduz alucinação.
- **Background e fan-out:** despacho via `run_in_background`; perguntas
  independentes viram scouts paralelos; o maestro segue conduzindo e coleta os
  relatórios quando chegam. Pergunta ad-hoc curta pode rodar em foreground.
- **Gatilhos:** Step 0.4 (sweep do mapa), pré-Step 2 (contexto de brief) e
  pergunta ad-hoc do usuário sobre a base (fora do ciclo de código).

### Read-only por adapter + guarda universal

Cada adapter ganha subseção "Research invocation" com o modo read-only do CLI:

- `codex`: `codex exec --sandbox read-only`.
- `claude`: `claude -p --model <cheap>` com ferramentas de escrita bloqueadas.
- `opencode`: sem flag nativa — instrução explícita no brief.

Guarda universal, agnóstica de CLI: `git status --porcelain` antes/depois do
scout. Árvore suja depois da pesquisa → reverter e contar como falha do scout.
É a garantia que não depende de recurso do CLI; as flags nativas são defesa em
profundidade.

### Verificação estrutural

Antes de consumir o relatório (alimentar brief ou responder o usuário):

1. Todo path citado existe (`ls`).
2. Todo símbolo/função citado bate um `grep` no path indicado.

Custa centavos e não traz tokens de conteúdo ao contexto premium. Âncora
fantasma → 1 retry com o feedback específico ("path X não existe"); falhou de
novo → maestro assume a pesquisa. Claims semânticas com âncora estrutural
válida são aceitas — no fluxo de brief, o Step 4 do ciclo ainda as apanha
indiretamente.

### Onboarding

A lane Research entra na **mesma pergunta única** de mapeamento do Step 0.6 —
sem segunda rodada de confirmação. Discovery reusa os adapters, filtrando para
candidatos baratos (`kimi|haiku|mini|nano|flash|free`). Cenários:

- **Full trio:** sugerir opencode + modelo barato (kimi/deepseek) ou
  `claude -p --model haiku`.
- **Sem codex:** idem.
- **claude only:** haiku em background.

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `routing.md` | tabela Support lanes + regras da lane research |
| `skills/batuta/SKILL.md` | seção "O batedor" (protocolo, contrato, verificação); Step 0.4 e 0.6 referenciam a lane; Step 2 ganha o gatilho pré-brief |
| `adapters/codex.md`, `adapters/claude.md`, `adapters/opencode.md` | subseção "Research invocation" (read-only + guarda universal) |
| `README.md` | documentação de usuário da lane de pesquisa |
| `docs/PRD.md` | decisão de design registrada |

A descrição do skill `batuta` passa a cobrir também perguntas sobre a base de
código (gatilho ad-hoc).

## Fora de escopo (YAGNI)

- Cache/persistência de relatórios de pesquisa.
- Log de pesquisas no WORK.md.
- Outras support lanes (review, testgen) — a tabela nasce com uma linha.
- Uso do agente Explore nativo do Claude Code como mecanismo (acoplaria o
  ciclo ao orquestrador; fica como otimização futura possível, não default).
