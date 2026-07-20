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
  bare `throw new Error` strings for expected failures, no swallowed rejections.
- Async: always `await` or return promises; no fire-and-forget without explicit
  justification in the brief.
- Never log or return secrets, tokens or full request bodies containing
  credentials.
- Database access goes through the existing ORM/query layer; no raw SQL unless
  the project already does it — and then always parameterized.
- Tests: follow the project's runner; integration tests use the project's
  existing test-database setup, never a production connection string.

## Verification hints for the orchestrator

- Flag: unvalidated input reaching handlers, missing auth checks on new routes,
  unparameterized queries, secrets in code or logs, new dependencies not
  requested by the brief.
