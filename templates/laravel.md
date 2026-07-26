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
