# Stack template: React

Conventions injected into briefs for React projects. Extends
`templates/generic.md`.

## Conventions for briefs

- Function components + hooks only; no class components.
- Follow the project's existing state approach (props drilling, context,
  zustand, redux…) — do not introduce a new state library.
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected (no conditional hooks).
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…) — never mix a second one in.
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Types: if the project uses TypeScript, no `any` — type props and returns
  explicitly.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

## Verification hints for the orchestrator

- Flag: missing `key` in lists, effects without cleanup where needed, state
  mutations, new dependencies not requested by the brief.
