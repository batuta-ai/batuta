# Living QA tree contract

This method is distilled from Pedro Nauck's work in
<https://github.com/pedronauck/skills>; the wording and operating constraints
here are Batuta's.

## Contents

- Layout and persistence policy
- Bootstrap procedure
- Scenario frontmatter and status enums
- Stable content-addressed ids, unique run identities, and merge behavior

The QA tree is committed project memory. Its default is `.batuta/qa/`; an
explicit path may relocate it only within the repository. Refuse a path that
resolves outside the repository instead of substituting a temporary location.

## Layout

```text
.batuta/qa/
├── README.md                 project conventions, area codes, entry points
├── personas.md               named user perspectives
├── scenarios/<AREA>-<slug>.md
├── journeys/J-<slug>.md
├── charters/CH-<slug>.md
├── bugs/BUG-<YYYYMMDD>-<slug>.md
├── reports/<YYYY-MM-DD>-<scope>-<run-id>.md
├── evidence/<YYYY-MM-DD>-<scope>-<run-id>/
├── automation-backlog/<slug>.md
├── state.csv                 generated scenario index
└── templates/{scenario,bug,charter,report}.md
```

Each scenario, journey, charter, bug, and backlog item owns a file. Each run
owns a new dated report and evidence directory with the same unique `run-id`
(see Id and merge rules); it never appends to a shared run log or replaces an
earlier report.

## Durable and per-run state

Durable, committed state comprises `README.md`, `personas.md`, `scenarios/`,
`journeys/`, `charters/`, `bugs/`, `automation-backlog/`, `reports/`, and
`templates/`. Update scenario verdicts in place; dated reports retain the
history behind those current values.

Per-run evidence belongs under that run's dated directory. `state.csv` is a
disposable view rebuilt from scenario frontmatter. Evidence and `state.csv`
are excluded by default; reports remain committed and point to retained
evidence or external artifacts.

Add these path-adjusted rules to `.gitignore` during bootstrap:

```gitignore
.batuta/qa/state.csv
.batuta/qa/evidence/
```

Projects may commit evidence by removing only the evidence rule and recording
the decision in the QA README. Large videos, traces, and logs stay in the
project's artifact store; reports record their locations.

## Bootstrap

1. Resolve the requested root, or `.batuta/qa/` when none is supplied, and
   verify that the resolved path remains inside the repository.
2. Inspect any existing QA material before creating directories. Reuse the
   living tree; do not create a parallel tracker.
3. Create the layout and seed the four Markdown templates supplied by the
   planning and running skills.
4. Record area codes, product entry points, startup commands, and the evidence
   choice in `README.md`; define personas in `personas.md`.
5. Append the adjusted ignore rules without duplicating existing entries.
6. When adopting older material, retain useful journeys, charters, and open
   bugs. Index historical reports in the README rather than copying them.
   Preserve unique legacy ids; resolve only actual collisions and record each
   prior id in the affected file.

## Scenario schema

One file at `scenarios/<id>.md` represents one persona-observable promise. Use
flat YAML frontmatter in this fixed order, one field per line; semicolon-separate
multiple ids, paths, or entry points. Free-form notes follow the frontmatter.

```yaml
---
id: PAY-complete-first-order
area: PAY
title: Complete a first order
persona: First-time buyer
journey: J-first-order
expected: Confirmation and the same order id remain visible after reload
entry_points: https://example.test/checkout; shop checkout
qa_status: untested
bug_ids:
fix_status:
retest_status:
fix_commits:
evidence:
last_report:
overlaps:
---
```

`area` is a 2–4 letter uppercase code declared in the QA README. `title` is a
short verb-first label. `persona` and `journey` must resolve to durable entries.
`expected` names one public observable. `last_report` identifies the dated
report that established the latest verdict. `overlaps` lists related scenario
ids with the canonical owner first.

The closed `qa_status` set is `untested`, `pass`, `fail`, `blocked-verify`,
`blocked-decision`, and `skipped`. An observed unresolved failure stays `fail`
and requires `bug_ids`, even when repair is pending or deferred or verification
is unavailable. Without an observed failure, `blocked-decision` means evaluation
or expected behavior needs human judgment; `blocked-verify` means evaluation
needs unavailable verification. A blocked verdict records its exact missing
human, browser, account, service, or decision prerequisite in the body. A skipped
verdict records its reason there.

When bugs are linked, `fix_status` is `pending`, `fixed`, or `deferred`; it is
otherwise empty. `fixed` requires `fix_commits`. After a fix, `retest_status` is
`pending`, `pass`, or `fail`; it is otherwise empty. A fixed scenario is not
settled until its retest passes.

## Id and merge rules

Mint new scenario ids as `<AREA>-<slug>`, where the slug is 2–5 kebab-case
words derived from the promised behavior. Mint journeys, charters, and bugs
from their stable slug or date-plus-slug pattern shown above. These ids are
content-addressed: never inspect a maximum value or maintain a shared counter.
The same behavior therefore converges on the same id across branches.

Run identities are unique, not content-addressed. For each new run, mint
`run-id` once as a UUID v4 using a host-available UUID facility before the first
session. Record it in the report and use it in both paths shown in Layout.
Independent runs get different identities even with equal dates and scopes.
A counter, timestamp alone, or checking only the current branch for an existing
filename is insufficient. Refuse an unexpected existing new-run report or
evidence path rather than overwriting it.

All checkpoints and resume reuse the recorded identity, report path, and evidence
links. Resume existing reports in place, including legacy reports without UUIDs;
do not rename historical artifacts or mint a new identity for an interrupted run.

Ids never change after references exist. Retire a scenario with `skipped` and
a body note. If two files overlap, cross-link them and choose one canonical
owner. Different scenarios and runs merge as different files; concurrent edits
to the same scenario remain a small frontmatter conflict resolved using the
newer `last_report`, while both dated reports stay intact.
