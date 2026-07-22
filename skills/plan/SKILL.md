---
name: plan
description: Batuta's formal planning. Use when the user invokes /batuta:plan or when work will span sessions and needs an approvable, persistent plan.
---

# Batuta — formal plan

Use only for work that spans sessions. Work that fits in one session uses inline
planning (2–3 questions in the conversation) or goes straight into the cycle.

## How

With superpowers installed, conduct steps 1–2 by the `writing-plans` method
(plugin root `superpowers.md`, `/batuta:plan` row); artifact, format and
approval below stay unchanged.

1. Understand the goal; ask the missing questions (few, all at once).
2. Break the work into atomic-commit-sized tasks. For each one:
   - a 1–2 sentence description;
   - estimated complexity (trivial/medium/complex/critical) and the executor predicted by
     the routing table;
   - acceptance criteria.
3. Save to `.batuta/plan-<slug>.md` in the project, in this format:

```markdown
# Plan — <title>

**Goal:** <1–3 sentences>
**Created:** <date>
**Status:** proposed | approved | in progress | done

## Tasks
- [ ] 1. <task> — <predicted executor>
      Accept: <criteria>
- [ ] 2. ...

## Decisions and context
<free prose: what a fresh session needs to know to resume>
```

4. Present the plan to the user and **wait for approval** before executing.
5. Approved → execute task by task through the normal cycle of the `batuta`
   skill, ticking the plan's checkboxes and recording in `WORK.md`.

Prose + checkboxes, no rigid schema. The plan is resumable: a fresh session must
be able to continue from the file alone.
