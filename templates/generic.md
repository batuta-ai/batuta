# Stack template: generic

Baseline conventions injected into every task brief when no specific stack
template applies. Stack-specific templates build on top of these.

Catalog rules: templates are adaptive — the project's existing patterns win;
rules never prescribe a library where the project has its own choice. Every
template carries a `Never:` block (3–6 objective, diff-visible anti-patterns)
and stays within ~35 lines (generic, carrying this note, runs slightly
longer); a child template never repeats its parent's rules.

## Conventions for briefs

- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source: type-silencing casts, empty
  catch blocks, sleeps/timeouts to fix ordering, copy-pasting similar code to
  dodge the real fix. Root cause genuinely out of reach → mark
  `// WORKAROUND: <reason>` and flag it in your report.

## Verification hints for the orchestrator

- Confirm the diff stays within the brief's file list; flag any file outside it.
- Traceability test: every changed line should trace directly to the brief —
  flag lines that don't (drive-by "improvements", reformatting, deleted
  comments).
- Check for orphans the change created (now-unused imports, variables,
  functions) and for pre-existing dead code deleted without being asked.
- Watch for silenced signals: swallowed errors (empty catch, ignored return
  codes), type-silencing casts, sleeps added to fix ordering. A
  `// WORKAROUND:` marker demands a justification in the report — judge it;
  an unmarked workaround fails verification.
