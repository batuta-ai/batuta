# Design — Pointer de descoberta do Batuta no `AGENTS.md`

**Data:** 2026-08-01
**Status:** Aprovado em design — pré-implementação

## Problema

O conhecimento do Batuta vive nas skills do plugin Claude Code. Uma sessão-maestro
que nasce fora do fluxo habitual — tipicamente uma sessão Claude Code gerenciada
pelo Compozy OS — não sabe que o projeto delega via Batuta até o usuário pedir
explicitamente ("use o Batuta para delegar"). O plugin carrega quando invocado
(confirmado em uso real); a lacuna é exclusivamente de **descoberta no início da
sessão**, não de capacidade.

## Decisão

O `/batuta:init` passa a oferecer, com consentimento explícito (opt-in), a escrita
de um **bloco marcado** no `AGENTS.md` do projeto apontando para o ciclo Batuta.
Nenhum artefato novo no lado do Compozy; nenhuma skill nova; ciclo e adapters
intactos.

A alternativa "skill/agent nativo no catálogo Compozy" foi avaliada e adiada:
duplicaria o ciclo em duas fontes da verdade antes de existir o núcleo em texto
neutro previsto na direção orquestrador-agnóstico. Quando essa spec futura
existir, um binding Compozy fino sobre o texto neutro é a forma correta — fica
registrado lá, não aqui.

## O bloco

```markdown
<!-- batuta:begin — managed by /batuta:init, edit via reconfigure -->
## Batuta
This project delegates code tasks via the Batuta cycle. If you are the
session talking directly to the user (the maestro), route delegable work
through the `batuta` skill — classify, route via `.batuta/routing.md`,
delegate, verify. If you received a delegated brief, IGNORE this section
and follow your brief only.
<!-- batuta:end -->
```

Regras:

- **Marcadores** `batuta:begin`/`batuta:end` tornam a escrita idempotente: o
  reconfigure atualiza ou remove somente o bloco, nunca o resto do arquivo.
- `AGENTS.md` inexistente → criado contendo apenas o bloco.
- **Guarda anti-loop** (última frase do bloco): executores também leem
  `AGENTS.md`; sem a guarda, um executor no meio de um brief poderia concluir
  que deve ele próprio delegar. A frase corta o loop e conversa com o contrato
  dos adapters (o brief manda).
- Placement em `AGENTS.md` (não `CLAUDE.md`): a direção registrada do projeto é
  orquestrador-agnóstico — o pointer deve valer para qualquer maestro futuro.

## Mudanças por arquivo

### `skills/init/SKILL.md`

1. **First run:** novo sub-passo após o passo 3 (salvar profile): oferecer o
   pointer como parte da pergunta única de confirmação do onboarding. Aceito →
   escrever o bloco; recusado → nada, sem re-oferta automática.
2. **Carve-out da regra "never edit those files"** (passo 1): a proibição de
   editar `CLAUDE.md`/`AGENTS.md` ganha a exceção explícita do bloco marcado
   `batuta:begin/end`, escrito somente com consentimento. Fora do bloco, a
   regra permanece integral.
3. **Reconfigure:** "pointer on/off" entra na lista de coisas alteráveis
   (passo 3 do modo reconfigure). O reconfigure também detecta bloco ausente,
   corrompido ou com marcador quebrado e oferece reescrever.

### `compozy.md`

Seção "Setup prerequisites (init)": uma linha registrando que o pointer no
`AGENTS.md` é o que torna maestros gerenciados (sessões nascidas no daemon)
cientes do Batuta por padrão — recomendado quando o profile tem
`Runtime: compozy`.

## O que não muda

- Ciclo (`skills/batuta/SKILL.md`), adapters, routing, verification.
- Nenhum arquivo é escrito sem consentimento do usuário.
- O Compozy segue host/runtime — nunca maestro (decisão registrada).

## Riscos aceitos

- O bloco vive em arquivo do usuário; pode ser editado ou quebrado à mão. O
  reconfigure detecta e oferece reescrever — nunca reescreve sozinho.
- O pointer só surte efeito se o maestro da sessão tiver acesso à skill
  `batuta` (caso confirmado: Claude Code sob Compozy carrega o plugin). Para
  maestros sem a skill, o bloco ainda documenta a convenção do projeto, mas o
  ciclo completo depende da futura spec do núcleo neutro.

## Critérios de sucesso

1. Sessão Claude Code aberta via Compozy num projeto com o pointer delega via
   Batuta sem instrução manual do usuário.
2. Executor (codex/opencode) executando um brief num projeto com o pointer não
   tenta delegar — segue o brief.
3. Rodar `/batuta:init` (reconfigure) duas vezes seguidas não duplica o bloco.
