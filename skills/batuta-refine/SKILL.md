---
name: batuta-refine
description: Refine a plan or unresolved decision in short, dependency-aware rounds. Use for /batuta-refine or when material choices block planning. Skip interviewing when the task is already specific and authorized. Refinement alone does not authorize implementation.
---

# Batuta refine

Resolve the decisions that materially change scope, acceptance, risk or task order.
Keep the result usable by the existing Batuta planning workflow.

## Establish what is known

1. Read the request, prior answers and relevant existing plan/context. Preserve settled choices, constraints and authorization; reopen a decision only when new evidence conflicts with it, explaining why.
2. Look up relevant environment facts in available files, documentation or tools before asking the user. Distinguish observed facts from assumptions and missing evidence. If lookup is unavailable, name the gap; ask only when it blocks a material decision.
3. Map unresolved decisions and their prerequisites. A pending fact lookup also blocks its dependent decisions. Continue independent useful refinement while it is pending; delegating the lookup itself is optional.
4. If the task is already specific and authorized, skip the interview and hand it back to the authorized workflow with its constraints intact. Do not require approval again.

## Ask a bounded round

- Ask one to three material questions whose prerequisites are settled. Defer dependent questions until their parent decision or needed evidence is resolved.
- Give each question a recommended answer, a short reason and the meaningful trade-off; accept alternatives. Separate the recommendation from an accepted decision.
- Honor existing answers. Wait for answers before treating choices as settled, then update only the affected dependencies.
- Make low-impact, reversible assumptions explicit instead of interviewing about every detail. Keep consequential unresolved choices open; a deadline or silence does not decide them.
- Stop questioning when no material decision blocks a useful plan or authorized next step. If an answer or evidence is unavailable, hand off the bounded blocker and any independent next steps; do not exhaust every hypothetical branch.

## Hand off

Summarize the settled decisions and reasons, explicit assumptions, open decisions with their dependencies, and next steps with the proof they need. Preserve exact commands, paths and other executable requirements. Report evidence limits without turning passing checks into broader claims.

Use the existing plan's **Decisions and context** section when updating a plan is in scope; preserve its task/status contract and scope decisions to the affected tasks. Otherwise return a compact inline handoff. Do not create a separate decision ledger or mandatory state file.

For a requested multi-session formal plan, use [batuta-plan](../batuta-plan/SKILL.md). For an already authorized implementation, return to the [batuta](../batuta/SKILL.md) cycle. Carry existing authorization forward without inventing another approval checkpoint. A request to refine authorizes refinement only; do not start implementation or mark a plan approved from that request alone.

*Done when:* the next step is clear, material decisions are resolved or explicitly blocked, and the handoff preserves scope and authorization.
