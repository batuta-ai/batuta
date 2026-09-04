# Templates por stack — catálogo expandido, adaptativo com vetações

**Data:** 2026-07-26 · **Status:** aprovado em conversa, aguardando plano de implementação

## Problema

Os templates de stack (`templates/`) são o mecanismo que injeta convenções em
todo brief (Step 2 do ciclo) — é o que impede o executor barato de inventar
padrão próprio. Hoje o catálogo tem 4 entradas (`generic`, `react`, `vue`,
`node-api`), curtas e adaptativas, mas não cobre as stacks que o usuário
realmente usa (Next.js, React Native, Python, Laravel, NestJS) e não tem um
bloco explícito de anti-padrões vetados — a categoria de regra que mais
melhora a taxa de acerto de modelos pequenos.

## Decisões (tomadas em conversa)

1. **Cinco templates novos:** `nextjs.md`, `react-native.md`, `python.md`,
   `laravel.md`, `nestjs.md`. Catálogo cresce só pelo que o usuário usa —
   não é uma enciclopédia.
2. **Caráter adaptativo + vetações** — mantém a filosofia atual: o projeto
   manda ("siga o padrão existente, não introduza lib nova"); o template
   garante que o executor não invente. Novidade: um bloco padronizado de
   vetações (anti-padrões proibidos) por stack. Nada prescritivo do tipo
   "use a lib X" — regras que envelhecem devagar.
3. **Molde atual preservado** — cada template segue o formato de
   `react.md`: cabeçalho com cadeia de herança (`Extends …`), seção
   `## Conventions for briefs` e seção
   `## Verification hints for the orchestrator`.
4. **Vetações como bloco padronizado** — sub-bloco `Never:` dentro de
   Conventions, 3–6 linhas por stack. Os 4 templates existentes são
   retrofitados com o mesmo bloco, por consistência (extraindo vetações já
   implícitas no texto, ex.: "no class components").
5. **Teto de tamanho: ~35 linhas por template** — eles entram em todo
   brief; cada linha custa contexto em toda delegação. O teto vira regra
   declarada onde o catálogo é descrito.
6. **Mais específico vence** — um projeto referencia UM template no
   profile; o init escolhe o mais específico da cadeia (Next.js > React >
   generic). Sem composição de fragmentos, sem mudança no formato do
   profile.

## Desenho

### Cadeias de herança

```
generic
├── react
│   ├── nextjs          (novo)
│   └── react-native    (novo)
├── vue
├── node-api
│   └── nestjs          (novo)
├── python              (novo)
└── laravel             (novo)
```

`Extends` significa: as convenções do pai valem também; o filho só adiciona
ou aperta — nunca repete o que o pai já diz. O brief referencia o template
do profile; o maestro inclui a cadeia inteira (filho + pais) na seção
Conventions do brief, como já faz com `react.md` + `generic.md`.

### Formato de cada template (molde)

```markdown
# Stack template: <nome>

Conventions injected into briefs for <stack> projects. Extends
`templates/<pai>.md`.

## Conventions for briefs

- <regras adaptativas: siga o padrão do projeto em X, detecte antes de criar…>

Never:

- <3–6 anti-padrões vetados da stack, verificáveis no diff>

## Verification hints for the orchestrator

- <o que o maestro checa no Step 4 além do genérico>
```

### Conteúdo dos cinco novos (resumo do escopo; redação final no plano)

- **`nextjs.md`** (extends react): detectar App Router vs Pages e seguir o
  existente; data fetching no server por padrão no App Router; `"use
  client"` só com razão concreta (estado/efeito/browser API); rotas, layouts
  e metadata seguindo a estrutura existente. Never: fetch client-side de
  dado que a rota pode buscar no server sem razão; misturar App/Pages numa
  feature nova; `next/image`/`next/link` trocados por tags cruas; segredos
  em código client.
- **`react-native.md`** (extends react): seguir a navegação existente
  (expo-router/react-navigation) sem introduzir outra; componentes RN core +
  o design system do projeto, sem lib de UI nova; estilos pelo método do
  projeto (StyleSheet/styled/tailwind-rn); código por plataforma só quando o
  projeto já usa `.ios/.android` ou `Platform`. Never: APIs web (DOM,
  `window`) fora de webview; dimensões fixas onde o projeto usa layout
  flexível; assets fora do padrão de pastas do projeto.
- **`python.md`** (extends generic): seguir o gerenciador do projeto
  (uv/poetry/pip) e nunca instalar fora dele; type hints em assinaturas
  públicas quando o projeto os usa; estrutura de módulos/pacotes existente;
  pytest no padrão do projeto (fixtures/conftest existentes). Never: `except`
  nu ou silencioso; mutable default em argumento; import com efeito
  colateral; f-string em query SQL.
- **`laravel.md`** (extends generic): convenções do framework antes de
  invenção própria (nomes de rota, controllers finos, form requests para
  validação quando o projeto os usa); Eloquent no padrão existente
  (relationships, scopes); migrations sempre reversíveis e nunca editadas
  após aplicadas; testes com o runner do projeto (Pest/PHPUnit). Never:
  query crua onde o projeto usa Eloquent; lógica de negócio em controller
  quando o projeto tem services/actions; `env()` fora de arquivos de config.
- **`nestjs.md`** (extends node-api): módulos e DI no padrão do projeto —
  providers registrados, nada de instanciar serviço na mão; DTOs com a
  validação que o projeto usa (class-validator/zod); respeitar o adapter
  HTTP configurado (fastify: plugins e decorators pelo caminho do Nest,
  nunca express-isms); testes unit/e2e no molde existente. Never: acessar
  request/response cru fora de onde o projeto já acessa; novo módulo global
  sem pedido; misturar padrões express em projeto fastify.

### Retrofit dos 4 existentes

Adicionar o sub-bloco `Never:` extraindo as vetações já implícitas
(ex.: react: class components, segunda lib de estilo, `any`, hooks
condicionais) — sem crescer o resto do texto; o teto de ~35 linhas vale para
eles também.

### `skills/init/SKILL.md`

O passo 3 do onboarding passa a referenciar o catálogo completo (a lista
literal de templates atualizada) com a regra "mais específico vence" em uma
linha: detectada a stack (pelo lockfile/composer.json/pyproject etc. ou
perguntando), escolher o template mais específico que se aplica; na dúvida
entre pai e filho, o filho.

### Onde o teto e o molde ficam registrados

Uma nota curta no topo de `templates/generic.md` (o pai de todos): catálogo
adaptativo, bloco `Never:` padronizado, teto de ~35 linhas por template.
Evita criar um `templates/_template.md` novo — generic já é lido em toda
cadeia.

### O que fica de fora (YAGNI)

- **Fragmentos composáveis** (`rules/` por preocupação) — rejeitado na
  conversa: cerimônia sem ganho no tamanho atual do catálogo.
- **Seção greenfield/prescritiva** — rejeitada: adaptativo + vetações
  cobre; se um dia fizer falta, é spec própria.
- **Detecção automática de stack no ciclo** — a escolha do template
  continua sendo do init (com confirmação do usuário); o ciclo só consome o
  que o profile referencia.
- **Versões/atualização de best practices** — sem mecanismo de versão; o
  catálogo é markdown editável, e regras adaptativas envelhecem devagar por
  construção.

## Documentação

- `README.md` — atualizar a menção ao catálogo de templates (lista nova e a
  frase sobre vetações), onde os templates já são citados.
- `docs/PRD.md` — atualizar a lista de templates na árvore §5.1 e onde o
  catálogo é descrito; linha nova na tabela de decisões §9 (adaptativo +
  vetações, teto de ~35 linhas, mais específico vence).

## Critérios de aceite

1. Cinco templates novos existem em `templates/`, cada um ≤ ~35 linhas, no
   molde (cabeçalho + Extends, Conventions com bloco `Never:`, Verification
   hints), em inglês, sem repetir regras do pai.
2. Os 4 templates existentes têm o bloco `Never:` e permanecem ≤ ~35 linhas.
3. `templates/generic.md` carrega a nota do catálogo (adaptativo, `Never:`
   padronizado, teto ~35 linhas).
4. `skills/init/SKILL.md` lista o catálogo completo e a regra "mais
   específico vence".
5. Nenhuma regra prescreve lib/framework onde o projeto pode ter escolha
   própria — tom adaptativo em tudo; vetações só para anti-padrões
   objetivos, verificáveis no diff.
6. README e PRD refletem o catálogo novo.
