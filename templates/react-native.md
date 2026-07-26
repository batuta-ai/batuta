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
