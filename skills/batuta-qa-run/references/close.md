# Close and fix governor

Close a QA round without turning its ledger green by omission. The dated report
is the resumable run record; the living tree keeps the latest settled truth.

## Contents

- Run ledger states
- Open the report
- Write back each session
- Govern fixes
- Prove an automatic fix
- Escalate work outside the bounds
- Close the round
- Failure patterns

## Run ledger states

Every session row uses exactly one of these values. Put qualifications, links,
and explanations beside the row rather than inventing another status.

| Status | Use when | Terminal for this round |
|---|---|---|
| `Pending` | The planned session has not been walked | no |
| `Pass` | The expected public result and an independent reread agree | yes |
| `Fail` | An observed failure remains unresolved, including a failed replay | yes |
| `Fixed` | A found failure was governed, fixed, proven, and re-walked | yes |
| `Skipped` | Risk ordering cut the session; the reason is recorded | yes |
| `Blocked (needs human verify)` | Evaluation needs a named human action or unavailable capability, with no observed failure | yes |
| `Blocked (human decision)` | Evaluation or expected behavior needs human judgment, with no observed failure | yes |

A round cannot close while any row is `Pending`. An observed unresolved failure
must end as `Fail`, with its registered `bug_ids` linked, even when repair needs
human approval or verification is unavailable. Pending or deferred repair belongs
in `fix_status` and `Decisions for a Human`, not in the evaluation verdict.
Human verification is distinct from product judgment: it records exact steps a
person can perform without making a product choice. Neither blocked state erases
an already observed failure.

Map settled rows into scenario frontmatter from the tree contract:

| Ledger | `qa_status` | Fix fields |
|---|---|---|
| `Pass` | `pass` | empty unless a linked historical bug requires them |
| `Fail` | `fail` | linked `bug_ids`; actual `fix_status`; `retest_status: fail` after a failed replay |
| `Fixed` | `pass` | `fix_status: fixed`; `retest_status: pass`; commit recorded |
| `Skipped` | `skipped` | reason in the scenario body |
| `Blocked (needs human verify)` | `blocked-verify` | exact prerequisite in the body |
| `Blocked (human decision)` | `blocked-decision` | evaluation or expected-behavior decision link in the body |

## Open the report

Create `[qa-root]/reports/<YYYY-MM-DD>-<scope>-<run-id>.md` as soon as scope and
the risk-ordered session ledger are known, before entering the first session.
Mint and record the UUID v4 `run-id` once through a host-available UUID facility,
following [the tree contract](../../batuta-qa-plan/references/tree.md#id-and-merge-rules).
Use the same id for `[qa-root]/evidence/<YYYY-MM-DD>-<scope>-<run-id>/`.
Seed every planned row as `Pending`, and include the target build, personas,
journeys, charters, tour, time box, and intended evidence location.

Never overwrite an earlier round: refuse an unexpected existing new-run report
or evidence path. Independent runs use different identities, not scope suffixes
chosen by local filename checks. Resume an interrupted round by reopening its
existing report and continuing its `Pending` rows; reuse its recorded identity,
path, and evidence links at every checkpoint. This includes legacy reports
without UUIDs: do not rename historical artifacts or make a second report for
the same run.

The report is the checkpoint for the active round. Update it on disk after every
session, governed fix, retest, skip, or block so another runner can resume without
replaying completed work.

## Write back each session

Immediately after a charter ends:

1. Set its report-ledger rows to a closed result, or leave only work that truly
   has not begun as `Pending`.
2. Append the persona, entry point, public actions, observed result, independent
   reread, evidence paths, timing, end state, branches, paper cuts, and bug ids to
   the report debrief.
3. Update each affected scenario's verdict fields, `evidence`, and `last_report`.
4. Deduplicate failures in the shared bug registry before linking `bug_ids`.
5. Record blocked prerequisites or skipped reasoning in both the report and the
   scenario body.

Do not batch this work until the end. A result missing from the committed tree
did not become durable QA knowledge.

## Govern fixes

End the persona session before considering an edit. For each registered failure
or sharp paper cut, write down the user-visible symptom and its root cause, then
judge all four bounds before changing product code:

- **Narrow:** only a few files; no schema, data, protocol, dependency, or public
  contract migration.
- **Understood:** evidence identifies the cause, not merely the failing surface.
- **Contained:** the likely blast radius is local and the adjacent journeys are
  known and runnable.
- **Unambiguous:** reasonable product or design owners would not choose different
  behavior.

Automatic repair is allowed only when every bound passes. Record that judgment
in the report first. If new evidence breaks a bound after editing starts, restore
the complete pre-fix state, keep the bug open, and escalate it. Never leave a
partial repair in order to improve the ledger.

## Prove an automatic fix

Each automatic repair is one logical commit tied to its bug id and carries all
of this evidence:

1. A focused regression test that fails against the unfixed behavior and passes
   after the repair.
2. The bug record's separate root-cause statement, fix commit, and test path.
3. A fresh persona walk of the affected journey from its real entry point.
4. Fresh walks of adjacent journeys that share the changed surface or service.
5. Independent public rereads and new evidence from the repaired build.

When an automated assertion cannot meaningfully prove a copy-only or visual
change, use a documented replay: exact steps, before-and-after evidence, the
reason automation is unsuitable, and a linked automation-backlog entry. That is
the only substitute for red-before and green-after proof.

Move the bug to `fixed` after the commit, and to `verified` only after the
original persona and journey confirm the result. Only then, with all required
proof and replays complete, use `Fixed`. A failed replay leaves the ledger `Fail`
and scenario `qa_status: fail` with linked `bug_ids` and `retest_status: fail`.
Follow the existing bug lifecycle for a matching fresh observation (`re-found`
before verification, `regressed` after verification); revert a harmful repair,
and escalate rather than widening the governor.

## Escalate work outside the bounds

Anything failing one governor bound goes into the dated report under
`Decisions for a Human`. Include:

- the user-visible problem, impact tier, bug id, and evidence;
- the bound that prevents automatic repair;
- two or more viable options with their trade-offs when alternatives exist;
- one recommendation and the evidence behind it;
- the owner or exact prerequisite needed to continue.

Keep an observed unresolved failure at `Fail` / `qa_status: fail`, with linked
`bug_ids`; record pending or deferred repair in `fix_status` and the human
decision entry. Only when no failure has been observed, use
`Blocked (human decision)` / `blocked-decision` if evaluation or expected behavior
needs human judgment. For evaluation requiring an unavailable browser, account,
role, external service, or person without an observed failure, use
`Blocked (needs human verify)` / `blocked-verify`, with reproducible instructions.
Unavailable verification after an observed failure does not replace `Fail`.
Continue independent runnable sessions; never hide an escalation as a retry,
skip, or optimistic pass.

## Close the round

Before writing Final Status, check every item:

- [ ] No ledger row remains `Pending`; every skip and block explains why.
- [ ] Every in-scope journey has a persona session or a disclosed coverage gap.
- [ ] Every `Fail` or `Fixed` row links a deduplicated registry bug through `bug_ids`.
- [ ] Every observed unresolved failure remains `Fail`, including deferred repair
      and failed replay; blocks describe evaluation prerequisites, not repair approval.
- [ ] Bug lifecycle, scenario verdict, fix fields, and retest fields agree.
- [ ] Every automatic fix has a commit and regression proof or the documented
      replay exception, plus affected and adjacent journey results.
- [ ] Every session has a debrief; all evidence links resolve or name the
      retained external artifact.
- [ ] Production-parity differences and unavailable instruments are disclosed.
- [ ] The project's required local gate was run after the last fix and its real
      output is recorded; exact-head CI is recorded when available.
- [ ] Totals use the shared impact tiers and include open, blocked, and skipped
      work rather than counting only passes.
- [ ] Final Status says `ready`, `not ready`, or `ready with blocked items` in one
      actionable sentence supported by the ledger and gates.

Any observed unresolved failure requires `not ready`, never `ready` or
`ready with blocked items`. The latter may describe disclosed blocked evaluation
only when no observed failure remains unresolved and gates and required proof
permit readiness. A green session ledger cannot overrule a failed gate, missing
regression proof, or an undisclosed parity gap. Write Final Status last, then
leave the report and tree mutually consistent for the next planning round.

## Failure patterns

- Writing the report after testing discards resumability.
- Adding prose variants to the enum makes the ledger impossible to reconcile.
- Patching during a persona walk contaminates the observation.
- Fixing without a pre-edit governor decision turns QA into self-approval.
- Retesting only the changed path misses adjacent regressions.
- Treating a blocked leg as a pass or silently dropping it falsifies coverage.
