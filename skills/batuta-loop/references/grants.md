# Standing grants for a parked loop task

A grant is part of the answer to a parked question. It tells the runner which paths and operations the user already authorized, so the next executor session does not ask the same scope question again. Without it, an answer that said "yes, edit the docs" left the task to return to `waiting_input` for the next doc path.

## When to grant

Grant when the question is about scope: paths to touch or operations to run, and the user's answer (or a plan Decision written for that case) authorizes them. In a loop-first project the `critical` lane has no conversation, so the plan Decisions carry the grant the session would have given.

Do not grant for a design choice, a missing fact or a yes/no with no scope in it. Answer those with text only.

## How to write it

```
batuta loop --transport <mode> --answer <task> --allow-path 'docs/**' --allow-op lint,format --until task "Yes: edit the docs and run lint and format."
```

- Put every grant flag before the answer text; flag parsing stops at the first positional argument.
- `--allow-path` and `--allow-op` repeat. Grants only add: the task's grant is the union, at most 32 paths and 16 operations.
- Use the smallest globs that cover what the question names. A path is clean and repository-relative: `docs/**`, not `docs/` or `./docs`. Absolute paths, `..`, backslashes and invalid globs exit 1 naming the path.
- Give one `--allow-op` token per operation the answer text names. A token is lowercase (`^[a-z][a-z0-9-]{0,31}$`), and the runner compares tokens by equality, so the text must use the same tokens.
- An operation-only grant is valid, with no `--allow-path`: `batuta loop --transport <mode> --answer <task> --allow-op migrate "Yes: run the migrate operation."`
- `--until task` is the only duration and the default: the grant ends with the task in this delivery and never reaches another task or delivery.

## What never to grant

- Boundary paths: `WORK.md`, `.batuta/**`, CI configuration (`.github/**` and the other CI files), licenses and lockfiles at any depth. No glob reaches them. A boundary file the plan Scope itself names stays allowed.
- A question that needs a boundary path is answered by changing the plan Scope (back to `/batuta-plan` and a new approval) or by answering no.
- `**` or a wide glob as a shortcut for "whatever it needs".
- Paths outside the task's purpose.
- Anything the loop never does, such as merge or push.
- Anything the user, or a plan Decision written for that case, did not authorize. The executor reports its own coverage; the scope gate and boundary paths still decide what lands.

## Reading a park under a grant

The ask file and the `question_recorded` journal record carry `grant_park: <reason>`, and for `not_covered` also `beyond_grant: <items>`. The runner replies without parking when the question has no `Beyond grant:` clause or all its items are granted. A park without a grant has none of these keys. Act by reason:

- `not_covered` → relay the `beyond_grant` items and, if authorized, answer with a grant that adds exactly those items. A boundary item goes back to `/batuta-plan` or gets a no, never a grant.
- `malformed_clause` → answer restating the clause form `Beyond grant: paths: <paths>; operations: <operations>`, with no new grant.
- `turn_cap` → 3 grant turns are used; read the questions, answer the real decision, and consider whether the task needs splitting in the plan.
- `repeat` → the same question came back; read the questions, answer the real decision, and consider whether the task needs splitting in the plan.
- `deadline` → answer to resume, and name `--task-timeout` if it recurs.

## Version check

Grant flags need core v1.1.0-beta.58 or later. Run `batuta loop --help`: if it lists `-allow-path`, use the flags. If not, answer with text only, as before. Do not compare prerelease strings.
