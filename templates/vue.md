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
