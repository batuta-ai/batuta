# Bug registry

This registry model is shared by `batuta-qa-plan` and `batuta-qa-run`. The planner
owns its schema, and the runner reads it at
`../batuta-qa-plan/references/bugs.md` before recording a finding. The method is
distilled from Pedro Nauck's work at <https://github.com/pedronauck/skills>.

## Contents

- [Registry contract](#registry-contract)
- [Mint an id](#mint-an-id)
- [Deduplicate before filing](#deduplicate-before-filing)
- [Lifecycle statuses](#lifecycle-statuses)
- [Five user-impact tiers](#five-user-impact-tiers)
- [Technical triage mapping](#technical-triage-mapping)
- [Required fields](#required-fields)
- [History entries](#history-entries)
- [Quality checks](#quality-checks)

## Registry contract

Keep bugs under `[qa-root]/bugs/`, where `[qa-root]` defaults to
`.batuta/qa/`. Each bug has one Markdown file named `<id>.md`. The file and its
stable id survive sessions, releases, fixes, and regressions so later walkers can
see the full history of one user-visible symptom.

This document is the only severity model for the two QA skills. Classify impact
here; do not invent a second scale in charters, scenarios, reports, or debriefs.
Scenario links and reports may summarize a bug, but the registry file owns its
current status and history.

## Mint an id

New ids have this form:

`BUG-<YYYYMMDD>-<symptom-slug>`

- Use the date the symptom was first observed.
- Use two to five lowercase, kebab-separated words from the user's point of
  view, such as `BUG-20260909-checkout-loses-address`.
- Describe the observable failure, not a suspected component or cause.
- Never derive the id from a counter or the number of files already present.
- Never reset ids for a new session, release, persona, or branch.
- Never rename an id after filing. Improve the title as understanding changes.
- Preserve an imported unique id. If two imported ids collide, mint one id from
  the original discovery date, retain the former ids as aliases, and record the
  source paths in `Origin`.

Because the date and symptom determine the id, concurrent reports of the same
failure should converge. If branches create the same filename, reconcile their
evidence and history into one bug instead of choosing a new suffix.

## Deduplicate before filing

Search before creating a file:

1. Search `[qa-root]/bugs/` for the visible message, affected control, journey
   step, and plain-language symptom.
2. Inspect `bug_ids` in the affected scenarios and follow every plausible link.
3. Compare the entry point, observable result, and true end state. A changed
   technical cause does not make a new bug when the user experiences the same
   failure.
4. Choose the transition from the matching bug's current status:
   - For `open`, `re-found`, or `fixed`, set the status to `re-found` and append
     a re-found history entry. The fresh observation shows that the symptom is
     unresolved before a verified fix.
   - For `verified`, set the status to `regressed` and append a regression
     history entry.
   - For `regressed`, keep `regressed` and append the fresh observation to its
     history.
   - For `wont-fix`, keep `wont-fix` unless scope or risk has changed. When it
     has, reassess the disposition; set the status to `open` only when the bug
     is accepted for resolution.
   - For `invalid`, re-examine the recorded reasoning against the fresh
     evidence. Keep `invalid` unless that evidence establishes a real symptom;
     then set the status to `open` and record why the prior reasoning no longer
     applies.
5. Mint an id only when no existing file describes the same user-visible
   symptom.

When uncertain, update the most likely bug with the comparison evidence and
flag the identity question in the session debrief. Do not split history merely
to avoid deciding whether two observations match.

## Lifecycle statuses

Use exactly one current status:

| Status | Meaning | Next proof |
|---|---|---|
| `open` | Confirmed and awaiting a fix. | A fix commit or a recorded disposition; a matching fresh observation moves it to `re-found`. |
| `re-found` | Observed again before a verified fix. | Fix, disposition, or another dated observation that keeps it `re-found`. |
| `fixed` | A fix was applied but the original journey has not been replayed. | Replay with the affected persona and independent reread; a matching fresh observation moves it to `re-found`. |
| `verified` | The original journey was replayed and the symptom was absent. | Retain as durable history; a matching fresh observation moves it to `regressed`. |
| `regressed` | Observed again after the bug had reached `verified`. | A new fix followed by the original replay; another matching observation keeps it `regressed`. |
| `wont-fix` | Deliberately declined with an owner and rationale. | Keep `wont-fix` unless scope or risk changes; then reassess and move to `open` only if accepted for resolution. |
| `invalid` | Evidence shows tester error or an environment artifact. | Retain and re-examine the reasoning; keep `invalid` unless fresh evidence establishes a real symptom, then move to `open`. |

`re-found` and `regressed` are current statuses, not new identities. Repeated
observations append history to the same file. A new fix moves either status to
`fixed`; successful replay then moves `fixed` to `verified`.

Mirror the status in linked scenarios using their prescribed fix and retest
fields, but resolve disagreement in favor of the bug file and repair the links.

## Five user-impact tiers

Choose exactly one tier from the user's experience. When evidence supports two
tiers, select the more harmful one and explain why.

### Blocks-Completion

The person cannot finish a value-producing journey, or can finish only by
accepting an incorrect result. Examples include a submit action that has no
effect, valid credentials that cannot sign in, or a save confirmation followed
by missing data. An open instance on a release-critical journey blocks release.

### Data-Loss

Information the person entered, uploaded, or configured is destroyed, corrupted,
or becomes inaccessible without informed consent. Silent loss is included even
when the interface reports success. Treat this tier as release-blocking unless
the product owner records a narrower, recoverable impact.

### Trust-Damage

The journey may technically finish, but the result makes the product unreliable
or unsafe to believe. Conflicting identifiers, unexplained errors, impossible
timestamps, misleading confirmation, and unusable assistive output belong here.
Several related findings can block a release even when one alone would not.

### Friction

The journey completes correctly with avoidable delay, repetition, uncertainty,
or effort. Examples include re-entering known information, touch-inaccessible
controls, delayed feedback, and validation that arrives too late. Repeated
friction in one journey is a product-design signal.

### Cosmetic

Appearance or wording is wrong without harming completion, comprehension, or
trust. Examples include minor alignment, nonessential color drift, and harmless
typos. If a first-use or high-prominence surface changes confidence or creates
hesitation, classify it as Friction or Trust-Damage instead.

## Technical triage mapping

Keep engineering severity and priority as routing aids, derived from user impact:

| User-impact tier | Default severity | Default priority |
|---|---|---|
| Blocks-Completion | Critical | P0 |
| Data-Loss | Critical | P0 |
| Trust-Damage | High | P1 |
| Friction | Medium | P2 |
| Cosmetic | Low | P3 |

An override requires a sentence tied to journey importance, recoverability, or
scope. User-impact tier remains unchanged by implementation difficulty. Release
decisions use user impact; engineering queues may additionally use severity and
priority.

## Required fields

Every bug file records:

- `id`: stable id matching the filename.
- `title`: current plain-language symptom.
- `status`: one lifecycle status from this document.
- `impact`: one of the five user-impact tiers.
- `severity` and `priority`: the technical mapping or a justified override.
- `first_observed`: date of the first observation.
- `persona`: affected persona id or exact persona name.
- `journey_step`: journey id and step where impact becomes visible.
- `charter`: charter id for the observing session.
- `scenarios`: every affected scenario id, kept reciprocal with `bug_ids`.
- `reproduction`: exact steps from the persona's entry point through the
  observable failure.
- `expected`: user-visible expected result.
- `observed`: user-visible actual result.
- `evidence`: repository paths to screenshots, transcripts, responses, or
  reports that establish the observation.
- `public_reread`: the independent public interface used to verify durable
  state, or `not applicable` with a reason.
- `origin`: prior artifact path and alias when the record was imported; otherwise
  `native`.
- `history`: dated status entries with persona, charter, report path, and reason.

Once a fix exists, also require:

- `fix_commit`: the commit SHA that contains the fix.
- `regression_proof`: the automated test that failed before and passes after, or
  the exact replay plus the reason automation would not be meaningful.

## History entries

Append history; never rewrite an earlier observation. Each entry gives the date,
new status, persona, charter, report path, evidence paths, and a short reason.
For `re-found`, cite the fresh observation that shows persistence. For
`regressed`, cite the prior verification entry and the fresh observation. For
`fixed`, record the fix commit. For `verified`, record the complete replay and
independent reread.

## Quality checks

Before closing a session, confirm:

- Every failed scenario links to a deduplicated bug id.
- Every linked id resolves to one file in `[qa-root]/bugs/`.
- Each bug uses one lifecycle status and one user-impact tier from this file.
- Scenario status mirrors the registry without replacing registry history.
- `fixed` includes a fix commit and regression proof.
- `verified` includes evidence from the original persona and journey.
- `re-found` and `regressed` append evidence to the original id.
- No report introduces another severity scale.
