# Templates por stack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o catálogo `templates/` de 4 para 9 templates adaptativos com blocos `Never:` padronizados, e ensinar o init a escolher o mais específico.

**Architecture:** Cada template segue o molde existente (cabeçalho + `Extends`, `## Conventions for briefs` com sub-bloco `Never:`, `## Verification hints for the orchestrator`), com herança filho→pai sem repetição. `generic.md` ganha a nota do catálogo (adaptativo, `Never:` padronizado, teto ~35 linhas). O init lista o catálogo completo com "mais específico vence". README e PRD registram.

**Tech Stack:** Plugin Claude Code — arquivos Markdown apenas; verificação por `grep`/`wc -l` com saída esperada.

**Spec:** `docs/superpowers/specs/2026-07-26-templates-por-stack-design.md`

## Global Constraints

- Idiomas (PRD §9): templates e skills em **inglês**; README e PRD em **PT-BR**.
- Teto de ~35 linhas por template (tolerância de verificação: ≤ 40 no `wc -l`) — eles entram em todo brief.
- Tom adaptativo em tudo: nenhuma regra prescreve lib/framework onde o projeto pode ter escolha própria; vetações só para anti-padrões objetivos, verificáveis no diff.
- Filho nunca repete regra do pai (`Extends`): o brief carrega a cadeia inteira, repetição é custo dobrado.
- Um task verificado = um commit (mensagens em PT-BR, prefixos `feat:`/`docs:`).

---

### Task 1: Nota do catálogo + retrofit `Never:` nos 4 templates existentes

**Files:**
- Modify: `templates/generic.md` (reescrever inteiro)
- Modify: `templates/react.md` (reescrever inteiro)
- Modify: `templates/vue.md` (reescrever inteiro)
- Modify: `templates/node-api.md` (reescrever inteiro)

**Interfaces:**
- Produces: o molde com bloco `Never:` que as Tasks 2–4 seguem; a nota do catálogo em `generic.md` que as vincula ao teto de ~35 linhas.

- [ ] **Step 1: Reescrever `templates/generic.md` com este conteúdo exato**

````markdown
# Stack template: generic

Baseline conventions injected into every task brief when no specific stack
template applies. Stack-specific templates build on top of these.

Catalog rules: templates are adaptive — the project's existing patterns win;
rules never prescribe a library where the project has its own choice. Every
template carries a `Never:` block (3–6 objective, diff-visible anti-patterns)
and stays within ~35 lines; a child template never repeats its parent's rules.

## Conventions for briefs

- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow (lockfiles included).
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.

## Verification hints for the orchestrator

- Confirm the diff stays within the brief's file list; flag any file outside it.
- Traceability test: every changed line should trace directly to the brief —
  flag lines that don't (drive-by "improvements", reformatting, deleted
  comments).
- Check for orphans the change created (now-unused imports, variables,
  functions) and for pre-existing dead code deleted without being asked.
- Watch for silently swallowed errors (empty catch, ignored return codes).
````

- [ ] **Step 2: Reescrever `templates/react.md` com este conteúdo exato**

````markdown
# Stack template: React

Conventions injected into briefs for React projects. Extends
`templates/generic.md`.

## Conventions for briefs

- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.

## Verification hints for the orchestrator

- Flag: missing `key` in lists, effects without cleanup where needed, state
  mutations, new dependencies not requested by the brief.
````

- [ ] **Step 3: Reescrever `templates/vue.md` com este conteúdo exato**

````markdown
# Stack template: Vue

Conventions injected into briefs for Vue projects. Extends
`templates/generic.md`.

## Conventions for briefs

- Follow the project's API style: Composition API with `<script setup>` in Vue 3
  projects unless the codebase uses Options API — match what exists.
- Single-file components, PascalCase names; check neighboring folders for the
  colocation pattern before creating files.
- State: use the store already in place (Pinia, Vuex).
- Reactivity: `ref`/`computed` over manual watching; `watch`/`watchEffect` only
  for real side effects, with cleanup where needed.
- Props typed and validated (TypeScript or runtime validators, matching the
  project); emits declared explicitly.
- Styling: respect `scoped`/CSS modules/Tailwind as the project already does.
- Tests: follow the project's runner (vitest + vue-test-utils / testing-library).

Never:

- A new store alongside the existing one.
- Mutating props.
- Destructuring a reactive object in a way that loses reactivity.
- New components with undeclared emits or untyped props.

## Verification hints for the orchestrator

- Flag: missing `key` in `v-for`, reactivity lost through destructuring `ref`s,
  new dependencies not requested by the brief.
````

- [ ] **Step 4: Reescrever `templates/node-api.md` com este conteúdo exato**

````markdown
# Stack template: Node API

Conventions injected into briefs for Node.js backend/API projects. Extends
`templates/generic.md`.

## Conventions for briefs

- Follow the project's framework idioms (Express, Fastify, Nest…) and its
  existing layering (routes/controllers/services/repositories) — put new code in
  the layer where its neighbors live.
- Validate all external input at the boundary using the project's existing
  validator (zod, joi, class-validator…); never trust `req.body` shapes.
- Errors: use the project's error-handling pattern (middleware, filters); no
  bare `throw new Error` strings for expected failures.
- Async: always `await` or return promises.
- Database access goes through the existing ORM/query layer.
- Tests: follow the project's runner; integration tests use the project's
  existing test-database setup.

Never:

- Unvalidated external input reaching a handler.
- Raw SQL where the project uses an ORM/query layer — and never unparameterized.
- Logging or returning secrets, tokens, or credential-bearing request bodies.
- Fire-and-forget promises without explicit justification in the brief.
- A production connection string in tests.

## Verification hints for the orchestrator

- Flag: unvalidated input reaching handlers, missing auth checks on new routes,
  unparameterized queries, secrets in code or logs, new dependencies not
  requested by the brief.
````

- [ ] **Step 5: Verificar**

Run: `grep -c '^Never:' templates/generic.md templates/react.md templates/vue.md templates/node-api.md && wc -l templates/generic.md templates/react.md templates/vue.md templates/node-api.md`
Expected: `1` em cada arquivo; `generic.md` ≤ 43 (carrega a nota do catálogo), demais ≤ 40 linhas cada

- [ ] **Step 6: Commit**

```bash
git add templates/generic.md templates/react.md templates/vue.md templates/node-api.md
git commit -m "feat: nota do catálogo e blocos Never nos templates existentes"
```

---

### Task 2: Templates `nextjs.md` e `react-native.md`

**Files:**
- Create: `templates/nextjs.md`
- Create: `templates/react-native.md`

**Interfaces:**
- Consumes: molde e regras do catálogo da Task 1; ambos estendem `templates/react.md` e não repetem regras de react/generic.

- [ ] **Step 1: Criar `templates/nextjs.md` com este conteúdo exato**

````markdown
# Stack template: Next.js

Conventions injected into briefs for Next.js projects. Extends
`templates/react.md`.

## Conventions for briefs

- Detect App Router vs Pages Router from the existing `app/`/`pages/` tree and
  follow it; file conventions (`page`, `layout`, `route`, `loading`, `error`)
  per what the project already uses.
- App Router: fetch data on the server by default (server components, route
  handlers, server actions — whichever the project already uses); add
  `"use client"` only for a concrete reason (state, effects, browser APIs).
- Routing, layouts and metadata follow the existing structure — check sibling
  routes before creating files.
- Use `next/link`, `next/image` and `next/font` where the project does; match
  the rendering options (dynamic/revalidate) of neighboring routes.

Never:

- Client-side fetching of data the route can fetch on the server, without a
  stated reason.
- Mixing App Router and Pages Router in a new feature.
- Raw `<a>`/`<img>` where the project uses `next/link`/`next/image`.
- Secrets or server-only env vars referenced in client components.

## Verification hints for the orchestrator

- Flag: `"use client"` without a concrete need, server-only imports reaching
  client files, route files outside the project's router convention.
````

- [ ] **Step 2: Criar `templates/react-native.md` com este conteúdo exato**

````markdown
# Stack template: React Native

Conventions injected into briefs for React Native / Expo projects. Extends
`templates/react.md`.

## Conventions for briefs

- Navigation: follow the existing solution (expo-router, react-navigation) and
  its patterns — screen registration, params, typing.
- UI: React Native core components plus the project's design system; styling by
  the project's method (StyleSheet, styled-components, nativewind…).
- Platform-specific code only where the project already branches
  (`.ios.tsx`/`.android.tsx` files or `Platform` checks) — follow that pattern.
- Assets (images, fonts) go through the project's existing pipeline and folder
  layout.
- Lists: `FlatList`/`SectionList` (or the project's list library) for dynamic
  collections, with a proper `keyExtractor`.

Never:

- Web APIs (DOM, `window`, `document`) outside a webview.
- A new UI or navigation library alongside the existing one.
- Hardcoded pixel dimensions where the project uses flexible layout.
- Assets dropped outside the project's asset folders.

## Verification hints for the orchestrator

- Flag: unguarded platform-specific APIs, missing `keyExtractor`, inline styles
  in a StyleSheet project, new native dependencies (they require a rebuild).
````

- [ ] **Step 3: Verificar**

Run: `grep -c '^Never:' templates/nextjs.md templates/react-native.md && wc -l templates/nextjs.md templates/react-native.md && grep -c 'templates/react.md' templates/nextjs.md templates/react-native.md`
Expected: `1` em cada; ≤ 40 linhas cada; `1` em cada (cadeia de herança)

- [ ] **Step 4: Commit**

```bash
git add templates/nextjs.md templates/react-native.md
git commit -m "feat: templates Next.js e React Native"
```

---

### Task 3: Templates `python.md` e `laravel.md`

**Files:**
- Create: `templates/python.md`
- Create: `templates/laravel.md`

**Interfaces:**
- Consumes: molde e regras do catálogo da Task 1; ambos estendem `templates/generic.md` e não repetem regras dele.

- [ ] **Step 1: Criar `templates/python.md` com este conteúdo exato**

````markdown
# Stack template: Python

Conventions injected into briefs for Python projects (APIs, scripts, libs).
Extends `templates/generic.md`.

## Conventions for briefs

- Dependencies through the project's manager only (uv, poetry, pip +
  requirements) — never install outside it.
- Type hints on public function signatures when the project uses them; follow
  the project's strictness (mypy/pyright config).
- Follow the existing module/package layout; imports absolute or relative per
  the project's pattern.
- Errors: raise specific exceptions; follow the project's own exception
  hierarchy where one exists.
- Tests: pytest in the project's style — reuse existing fixtures and
  `conftest.py` before writing new setup.

Never:

- Bare or silent `except` (including `except Exception: pass`).
- Mutable default arguments.
- Imports with side effects (work at import time).
- SQL built by string interpolation or f-strings — always parameterized.

## Verification hints for the orchestrator

- Flag: `print` where the project uses logging, missing type hints in a typed
  codebase, tests that touch real services, new dependencies not requested by
  the brief.
````

- [ ] **Step 2: Criar `templates/laravel.md` com este conteúdo exato**

````markdown
# Stack template: Laravel

Conventions injected into briefs for Laravel projects. Extends
`templates/generic.md`.

## Conventions for briefs

- Framework conventions before invention: route names, controller placement,
  form requests for validation, policies for authorization — matching how the
  project already uses them.
- Controllers stay thin; business logic goes where the project puts it
  (services, actions, jobs).
- Eloquent in the project's existing style: relationships, scopes, casts —
  check neighboring models first.
- Migrations: always reversible (`down()` works); to change an applied
  migration, create a new one.
- Tests with the project's runner (Pest or PHPUnit), using its factories and
  database strategy (RefreshDatabase etc.).

Never:

- Raw queries where the project uses Eloquent/query builder — and never
  unparameterized.
- Business logic in controllers when the project has a service/action layer.
- `env()` calls outside `config/` files — use `config()`.
- Editing a migration that already ran.

## Verification hints for the orchestrator

- Flag: N+1 queries introduced (missing eager loading), mass assignment without
  `$fillable`/`$guarded` awareness, inline validation where the project uses
  form requests, new packages not requested by the brief.
````

- [ ] **Step 3: Verificar**

Run: `grep -c '^Never:' templates/python.md templates/laravel.md && wc -l templates/python.md templates/laravel.md && grep -c 'templates/generic.md' templates/python.md templates/laravel.md`
Expected: `1` em cada; ≤ 40 linhas cada; `1` em cada (cadeia de herança)

- [ ] **Step 4: Commit**

```bash
git add templates/python.md templates/laravel.md
git commit -m "feat: templates Python e Laravel"
```

---

### Task 4: Template `nestjs.md` + catálogo no init

**Files:**
- Create: `templates/nestjs.md`
- Modify: `skills/init/SKILL.md` (passo 3 do onboarding)

**Interfaces:**
- Consumes: molde da Task 1; `nestjs.md` estende `templates/node-api.md` e não repete regras dele.
- Produces: a lista literal do catálogo e a regra "most specific wins" que a Task 5 cita em PT-BR.

- [ ] **Step 1: Criar `templates/nestjs.md` com este conteúdo exato**

````markdown
# Stack template: NestJS

Conventions injected into briefs for NestJS projects (Fastify or Express
adapter). Extends `templates/node-api.md`.

## Conventions for briefs

- Modules and DI as the project does: register new providers in the right
  module; inject dependencies — never instantiate services by hand.
- DTOs with the project's validation approach (class-validator pipes, zod
  schemas…); keep request/response typing explicit.
- Respect the configured HTTP adapter: with Fastify, register plugins and touch
  request/reply through Nest's abstractions — no Express idioms.
- Follow the project's structure and naming for controllers/services/modules
  (`*.module.ts`, `*.service.ts`, …).
- Tests: unit tests with Nest's testing module as the project does; e2e tests
  follow the existing setup.

Never:

- Instantiating a provider manually where DI can inject it.
- Raw `req`/`res` access outside the places the project already does it.
- A new global module, pipe, filter or interceptor without the brief asking.
- Express-specific middleware or idioms in a Fastify project.

## Verification hints for the orchestrator

- Flag: providers missing from module registration, handlers taking untyped
  bodies without a DTO, circular imports between modules, new dependencies not
  requested by the brief.
````

- [ ] **Step 2: Atualizar o passo 3 do onboarding em `skills/init/SKILL.md`**

Localizar:

```markdown
3. Save the answers to `.batuta/profile.md`, referencing the matching stack
   template (`templates/react.md`, `templates/vue.md`, `templates/node-api.md`
   or `templates/generic.md`).
```

Trocar por:

```markdown
3. Save the answers to `.batuta/profile.md`, referencing the matching stack
   template — catalog: `templates/react.md`, `templates/nextjs.md`,
   `templates/react-native.md`, `templates/vue.md`, `templates/node-api.md`,
   `templates/nestjs.md`, `templates/python.md`, `templates/laravel.md`,
   `templates/generic.md`. Most specific wins: detect the stack (lockfiles,
   `composer.json`, `pyproject.toml`, framework deps in `package.json`) and
   pick the most specific template that applies (Next.js > React > generic);
   when in doubt between parent and child, the child.
```

- [ ] **Step 3: Verificar**

Run: `grep -c '^Never:' templates/nestjs.md && wc -l templates/nestjs.md && grep -c 'templates/' skills/init/SKILL.md && grep -c 'Most specific wins' skills/init/SKILL.md`
Expected: `1`; ≤ 40 linhas; ≥ 9 menções a `templates/` no init; `1`

- [ ] **Step 4: Commit**

```bash
git add templates/nestjs.md skills/init/SKILL.md
git commit -m "feat: template NestJS e catálogo completo no init"
```

---

### Task 5: Documentação (README + PRD)

**Files:**
- Modify: `README.md` (linhas ~113 e ~123)
- Modify: `docs/PRD.md` (§5.1 árvore ~linhas 89–93, §6.1 ~linha 128, §9 tabela)

**Interfaces:**
- Consumes: nomes do catálogo e regra "mais específico vence" das Tasks 1–4 (consistência PT-BR × EN).

- [ ] **Step 1: README — atualizar a pergunta de stack**

Localizar:

```markdown
- Qual a stack? (React, Vue, Node API... — ele detecta pelo `package.json` e sugere)
```

Trocar por:

```markdown
- Qual a stack? (React, Next.js, React Native, Vue, Node API, NestJS, Python, Laravel... — ele detecta pelos manifests do projeto e sugere o template mais específico)
```

- [ ] **Step 2: README — frase sobre vetações**

Localizar o parágrafo:

```markdown
As respostas viram o `.batuta/profile.md`, e as convenções da sua stack (via templates inclusos) entram **automaticamente em todo brief** enviado aos executores. Ou seja: o codex e o kimi seguem as regras do *seu* projeto sem você repetir nada.
```

Adicionar ao fim do mesmo parágrafo:

```markdown
 Cada template é adaptativo — o padrão do *seu* projeto manda — e traz um bloco de vetações: anti-padrões da stack que o executor nunca pode cometer.
```

- [ ] **Step 3: PRD §5.1 — atualizar a árvore de `templates/`**

Localizar:

```
├── templates/
│   ├── react.md           # convenções e regras de stack para briefs
│   ├── vue.md
│   ├── node-api.md
│   └── generic.md
```

Trocar por:

```
├── templates/
│   ├── react.md           # convenções e regras de stack para briefs
│   ├── nextjs.md
│   ├── react-native.md
│   ├── vue.md
│   ├── node-api.md
│   ├── nestjs.md
│   ├── python.md
│   ├── laravel.md
│   └── generic.md
```

- [ ] **Step 4: PRD §6.1 — catálogo adaptativo no parágrafo do perfil**

Localizar a frase:

```markdown
O resultado vira `.batuta/profile.md`. O template de stack correspondente
(`templates/react.md` etc.) é referenciado no perfil e suas convenções entram
automaticamente em todo task brief enviado aos executores.
```

Adicionar logo após essa frase (antes de "O usuário pode editar"):

```markdown
O catálogo é adaptativo com vetações: cada template segue o molde do
`generic.md` (convenções que respeitam o padrão do projeto + bloco `Never:`
de anti-padrões objetivos, teto de ~35 linhas), com herança filho→pai, e o
init escolhe o mais específico que se aplica (Next.js > React > generic).
```

- [ ] **Step 5: PRD §9 — nova linha no fim da tabela**

```markdown
| Templates por stack (catálogo expandido) | Nove templates adaptativos (`generic`, `react`, `nextjs`, `react-native`, `vue`, `node-api`, `nestjs`, `python`, `laravel`), cada um ≤ ~35 linhas com bloco `Never:` de anti-padrões objetivos e verificáveis no diff; herança filho→pai sem repetição; init escolhe o mais específico | Convenção explícita no brief é o que impede o executor barato de inventar padrão próprio; regras adaptativas ("o projeto manda") envelhecem devagar, e vetações objetivas são a categoria de regra que mais melhora a taxa de acerto de modelos pequenos |
```

- [ ] **Step 6: Verificar consistência**

Run: `grep -ci 'next\.js\|react native\|nestjs\|laravel' README.md && grep -c 'nextjs\.md\|nestjs\|laravel' docs/PRD.md && grep -c 'Never' docs/PRD.md`
Expected: README ≥ 2 (pergunta de stack); PRD ≥ 3 (árvore, §6.1, §9); PRD ≥ 2 (`Never:` no §6.1 e no §9)

- [ ] **Step 7: Commit**

```bash
git add README.md docs/PRD.md
git commit -m "docs: README e PRD registram o catálogo de templates por stack"
```
