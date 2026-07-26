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
