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
