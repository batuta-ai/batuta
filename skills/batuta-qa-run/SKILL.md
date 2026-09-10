---
name: batuta-qa-run
description: Run planned persona QA sessions through public product surfaces and write evidence, verdicts, findings, and debriefs into the living QA tree. Use after batuta-qa-plan.
disable-model-invocation: true
argument-hint: "[qa-root] [scope]"
metadata:
  author: Pedro Nauck
  source: https://github.com/pedronauck/skills
---

# Batuta QA run

Walk planned sessions at `[qa-root]`, default `.batuta/qa/`. This method is
distilled from Pedro Nauck's work at <https://github.com/pedronauck/skills>.

## Anchoring rules

- Stay in persona and use only public UI, CLI, or documented HTTP surfaces.
- Require proof through an independent public read path; a claimed or optimistic result is not a pass.
- Write every session back into the committed QA tree, or treat it as not run.
- Resolve the root inside the repository. Refuse an external path; never substitute a temporary directory.

## Procedure

1. **Resolve the run.** Read [the tree contract](../batuta-qa-plan/references/tree.md), [planning contract](../batuta-qa-plan/references/planning.md), and [closing contract](references/close.md), then inspect the tree README, planned charters, journeys, scenarios, open bugs, and prior reports. If the tree is absent, route to `batuta-qa-plan`; otherwise require a green automated suite, publicly reachable product, and real auth when the journey uses it, scope a change run to touched journeys plus one adjacent canary or a release run to its planned journeys, and open the new non-overwriting dated report with a risk-ordered ledger that makes every planned session resumable.
2. **Prepare each persona.** Read [references/session.md](references/session.md) before walking a charter; deliver a session configured for its entry point, knowledge, device, network, locale, modality, and patience.
3. **Walk the journey.** Read [the probe catalog](references/probes.md), then follow the enter-act-verify-capture loop in [references/session.md](references/session.md), including the charter's `Must try`, declared tour, all experiential lenses, selected edge probes, time box, branches, and abandonment through the true end state; deliver a verdict and evidence at each checkpoint or divergence.
4. **Record findings.** Read [the shared bug registry](../batuta-qa-plan/references/bugs.md), deduplicate every failure and sharp paper cut, then deliver linked bug and scenario updates using its impact and lifecycle model.
5. **Write the debrief.** Follow [the session writeback](references/session.md) and [closing contract](references/close.md) after each session, updating the dated report with observations, evidence paths, paper cuts, bug ids, and its ledger verdict; deliver resumable on-disk state with no completed row still planned.
6. **Govern fixes.** End the persona session, then follow [the closing contract](references/close.md) to judge, record, prove, and re-walk any automatic fix or escalate it; deliver only bounded fixes with their regression and public-reread evidence.
7. **Close the round.** Follow [the closing contract](references/close.md), reconcile scenario verdicts with [the planner's status enums](../batuta-qa-plan/references/tree.md) and bugs with [the shared registry](../batuta-qa-plan/references/bugs.md), then run the project's required gate; deliver a final readiness decision with totals by shared impact tier and every skip or blocked prerequisite disclosed.

## Companion skills

- `batuta-qa-plan` owns the tree, schemas, personas, journeys, scenarios, and charters that this skill executes.
- `batuta-review` independently checks the resulting diff, evidence, scope, and acceptance criteria.

## Error handling

- When a human, browser capability, account, role, or service is unavailable, mark only that leg blocked with the exact prerequisite and continue runnable public-surface sessions.
- Treat a stall as a finding: capture it, allow one clean-session retry while retaining the first failure, then end or continue only where the persona realistically can.
- If time expires, cut by the shared impact order and mark each omitted row `Skipped` with its reason.
