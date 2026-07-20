# Stack template: generic

Baseline conventions injected into every task brief when no specific stack
template applies. Stack-specific templates build on top of these.

## Conventions for briefs

- Follow the existing code style of the files you touch — naming, formatting,
  import order. Do not reformat code you were not asked to change.
- Change only what the brief asks. No drive-by refactors, no dependency
  additions unless the brief allows them explicitly. Every changed line must
  trace directly back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.
- Never touch: lockfiles (unless adding an allowed dependency), CI config,
  license, or anything listed under the brief's Boundaries.

## Verification hints for the orchestrator

- Confirm the diff stays within the brief's file list; flag any file outside it.
- Traceability test: every changed line should trace directly to the brief —
  flag lines that don't (drive-by "improvements", reformatting, deleted
  comments).
- Check for orphans the change created (now-unused imports, variables,
  functions) and for pre-existing dead code that was deleted without being asked.
- Watch for silently swallowed errors (empty catch, ignored return codes).
