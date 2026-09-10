---
name: batuta-qa-plan
description: Plan real-user QA as durable personas, mapped journeys, scenarios, and session charters in a committed project tree. Use to bootstrap or update QA plans; not to run sessions.
disable-model-invocation: true
argument-hint: "[qa-root] [scope]"
metadata:
  author: Pedro Nauck
  source: https://github.com/pedronauck/skills
---

# Batuta QA plan

Own the living QA plan at `[qa-root]`, default `.batuta/qa/`. This method is
distilled from Pedro Nauck's work at <https://github.com/pedronauck/skills>.

## Anchoring rules

- Keep durable knowledge in one committed tree; update it instead of producing round artifacts.
- Plan sessions, not test cases: the charter is the unit of work and the session ledger is the coverage measure.
- Resolve the root inside the repository. Refuse an external path; never substitute a temporary directory.
- Treat browser, CLI, and HTTP journeys equally when their true end state can be independently reread through a public interface.

## Procedure

1. **Resolve the tree.** Read [references/tree.md](references/tree.md), inspect existing QA state, and bootstrap or reconcile the requested root; deliver the living tree and its project conventions.
2. **Define the audience.** Read [references/planning.md](references/planning.md) § Personas and update durable project personas only when the audience changed; deliver `personas.md` with explicit accessibility or mobile exclusions.
3. **Map journeys before scenarios.** Read [references/planning.md](references/planning.md) § Journeys and flows and map every user-visible change or selected release journey through a true end state; deliver journey files with flows, public rereads, and abandonment paths.
4. **Derive coverage.** Read [references/tree.md](references/tree.md) for scenario state and [references/planning.md](references/planning.md) § Scenarios and coverage; deliver scenario files whose preserved verdicts reflect prior runs while new scenarios remain `untested`, plus a five-dimension coverage ledger.
5. **Register known bugs.** Read [references/bugs.md](references/bugs.md), reconcile existing findings by user-visible symptom, and register any imported finding only after deduplication; deliver stable bug files whose lifecycle, impact, and scenario links follow the shared registry.
6. **Charter the sessions.** Read [references/planning.md](references/planning.md) § Session charters and ledger; deliver risk-ordered, immutable charters so every in-scope journey has at least one persona session and the ledger names each planned walk.
7. **Record automation candidates.** Read [references/planning.md](references/planning.md) § Automation backlog; deliver deduplicated backlog items only for stable, valuable, or repeatedly failing paths.
8. **Validate the handoff.** Reread [references/planning.md](references/planning.md) § Planning completeness; deliver a plan with every gap, skip, and blocked leg recorded with its exact missing human, browser, account, service, or decision prerequisite.

## Companion skills

- `batuta-qa-run` walks the charters and writes verdicts, debriefs, bugs, and dated reports back into the same tree.
- `batuta-review` checks the resulting diff and evidence against scope and acceptance criteria.

## Error handling

- If the tree cannot be parsed or reconciled, repair and report the durable state before planning on it.
- If a branch or PR diff has no user-visible change, record that finding and stop without inventing sessions; release re-walks may still plan existing journeys.
- If the root cannot be created or resolves outside the repository, report the exact path problem and stop.
