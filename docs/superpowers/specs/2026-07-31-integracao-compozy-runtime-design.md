# Integração CompozyOS como runtime — sessões gerenciadas por lane

**Data:** 2026-07-31 · **Status:** proposta (discutida em conversa 2026-07-31), aguardando aprovação

## Origem e enquadramento

Continuação da destilação do [CompozyOS](https://www.compozy.com/docs/)
(ver spec 2026-07-31 de trilha + escopo). Lá ficou decidido o quadro de
três camadas: **host/runtime** (onde sessões vivem), **maestro** (quem
conduz o ciclo) e **instrumentista** (quem escreve código). O Compozy é
candidato à camada de host, nunca a maestro — ele não raciocina; gerencia
sessões duráveis de CLIs de agente, com transcript, permissões e replay.

Esta spec define **como** essa integração entra: pelo mesmo furo que o
plugin codex já usa — um arquivo de integração na raiz do plugin,
referenciado em linhas condicionais das skills, com degradação limpa.
Nenhum comando novo, nenhuma mudança no ciclo.

Fatos verificados na doc do Compozy que sustentam o desenho:

- Agentes são definidos por `AGENT.md` declarando identidade, **provider**
  (a CLI que executa), permissões e capacidades. Providers nativos:
  `claude`, `codex`, `gemini`, `qwen-code`; providers custom compatíveis
  com ACP podem ser registrados.
- Uma sessão ativa pode criar **sessões filhas** via `compozy spawn`:
  identidade validada, TTL obrigatório, filha dentro do canal de
  coordenação do pai, permissões ⊆ pai. Defaults: profundidade máx. 1,
  **5 filhas por pai**.
- Sessões são duráveis (sobrevivem ao terminal), inspecionáveis e mantêm
  transcript completo.

## Problema

Hoje o Step 3 delega por subprocess (`Bash`, comando não-interativo do
adapter). Funciona, mas:

- **Instrumentista invisível para o host.** Rodando sob Compozy, a
  delegação aparece como "a sessão do maestro rodou bash" — perde-se o
  transcript por executor que o daemon daria de graça.
- **Paralelismo frágil.** Lote paralelo depende de `run_in_background` do
  harness: morre com o terminal, e `/batuta:pause` no meio de um lote é o
  ponto mais quebradiço do ciclo.
- **Relato do executor vem do stdout.** A trilha (`.batuta/runs/`) grava o
  que o subprocess imprimiu; um transcript de sessão é fonte mais rica e
  auditável para o mesmo campo.

## Proposta

Um arquivo **`compozy.md` na raiz do plugin** — irmão de `superpowers.md`
e `codex-plugin.md`, mesmo padrão: dormante, skills o referenciam em uma
linha condicional, lido só quando a integração está ativa.

### Ativação (opt-in por perfil, como o Worktree)

Linha nova no `.batuta/profile.md`: `Runtime: compozy | direto` — sem
linha = `direto`, comportamento atual. O `/batuta:init` detecta o daemon
(CLI `compozy` no PATH + daemon respondendo) e **oferece** a linha; nunca
liga só por detecção — o usuário pode ter o Compozy instalado para outra
coisa. Reconfiguração muda a linha como qualquer outra do perfil.

### Linha de delegação (Step 3)

Com `Runtime: compozy`, a delegação de qualquer lane vira uma **sessão
filha** (`compozy spawn`) em vez de subprocess:

1. **O adapter continua dono do comando.** A sessão recebe como carga a
   invocação que o adapter define — flags de modelo da tabela de
   roteamento incluídas. Não existe "adapter do codex-sob-compozy":
   existe `adapters/codex.md` + o transporte. Isso evita explosão
   combinatória e mantém o contrato de adapter (PRD §6.8) intacto.
2. **Mapeamento lane → provider quando disponível.** Para executores que
   são providers nativos do Compozy (`claude`, `codex`), o `compozy.md`
   pode preferir a sessão com provider nativo em vez de embrulhar o
   comando — mesmo brief, mesma carga. `opencode` não é provider nativo:
   entra como custom ACP **se verificado viável**; senão, transporte
   embrulhado. A decisão por executor fica documentada no `compozy.md`,
   não nas skills.
3. **Worktree compõe.** A sessão filha nasce com working directory no
   worktree da tarefa quando a linha Worktree o exige — as duas
   integrações são ortogonais.
4. **Permissões ⊆ pai.** A policy do workspace do maestro precisa permitir
   as CLIs executoras; o `compozy.md` documenta isso como pré-requisito de
   setup (o init avisa quando a policy bloquear).

### Coleta de resultado (Step 3 → 4 → trilha)

O relato do executor passa a vir do **transcript da sessão filha**, não do
stdout. A regra de ouro não muda: relato nunca é evidência
(`verification.md`) — a fonte melhora, o ceticismo permanece. O campo
`## Relato do executor` da trilha (`.batuta/runs/`, spec 2026-07-31)
recebe o extrato relevante do transcript; a referência da sessão
(id/handle) entra na trilha para replay posterior.

### Paralelismo (Step 1.5/3)

Cada item do lote paralelo vira uma sessão filha própria — as sessões
sobrevivem ao terminal, então lote + `/batuta:pause` deixa de ser o ponto
frágil: o handoff registra os ids das sessões e o `/batuta:resume` as
reencontra vivas. **Limite verificado:** default de 5 filhas por pai —
lotes maiores rodam em ondas de ≤ 5, e o `compozy.md` nomeia esse limite
(configurável no daemon, não pelo Batuta).

### Status (`/batuta:status`)

Com `Runtime: compozy`, o status ganha uma fonte extra: consultar as
sessões filhas do daemon além das background tasks do harness. Uma linha
condicional na skill `status`, apontando para o `compozy.md`.

### Degradação limpa (regra de todas as integrações)

Daemon ausente, fora do ar, ou spawn recusado pela policy → subprocess
direto **com aviso em voz alta**, nunca silencioso. O ciclo jamais
depende do Compozy para funcionar — só fica mais observável e durável com
ele. Coerente com o critério registrado: nenhuma regra do ciclo depende de
capacidade exclusiva de um host.

## Fronteiras

- **O ciclo não muda uma vírgula.** Brief, verificação endurecida,
  veredito, commit atômico, `WORK.md`, trilha: idênticos. O Compozy troca
  *como o executor roda* e *de onde vem o relato* — nada mais.
- **Fonte de verdade continua em texto no repo.** `WORK.md` +
  `.batuta/runs/` — sessões do daemon são lente e músculo, não memória.
  Estado não fica refém do host (PRD §9).
- **Compozy como maestro: fora de escopo.** Host do maestro (o ciclo
  inteiro rodando como sessão gerenciada) funciona hoje sem nenhuma
  mudança no Batuta e não precisa de spec.
- **Escrita:** `compozy.md` no plugin; no projeto, só a linha `Runtime:`
  no perfil — dentro das fronteiras existentes.

## Verificações pendentes (antes de implementar)

1. Sintaxe exata de `compozy spawn` (comando, carga, working directory,
   captura do resultado) — a doc descreve o mecanismo, não a CLI.
2. Viabilidade do `opencode` como provider custom ACP; sem isso, a lane
   trivial roda por transporte embrulhado.
3. Como ler o transcript de uma sessão filha de forma não-interativa
   (para a coleta de resultado e a trilha).

## Critérios de aceite

- Sem linha `Runtime:` (ou `direto`): comportamento byte-idêntico ao
  atual, com ou sem Compozy instalado.
- Com `Runtime: compozy`: cada delegação vira sessão filha com o comando
  do adapter (ou provider nativo equivalente), e o transcript alimenta
  verificação e trilha.
- Lote paralelo pausado com `/batuta:pause` e retomado com
  `/batuta:resume` reencontra as sessões vivas pelos ids do handoff.
- Daemon indisponível → fallback para subprocess com aviso explícito;
  nenhum passo do ciclo falha por ausência do Compozy.
- Peso: skills crescem ≤ 1 linha condicional cada (`batuta` Step 3,
  `status`, `init`); todo o detalhe vive no `compozy.md` dormante.
