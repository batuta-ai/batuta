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
- Swallowed rejections (empty `.catch()`, ignored promise errors).

## Verification hints for the orchestrator

- Flag: unvalidated input reaching handlers, missing auth checks on new routes,
  unparameterized queries, secrets in code or logs, new dependencies not
  requested by the brief.
