---
name: batuta-council
description: Ask the council to critique a proposed plan before approval. Use for /batuta-council or `ask the council`. Runs core `batuta council` on a plan with Status proposed, judges every finding and advises the maintainer. Never approves. Read-only.
---

# Batuta council — a second opinion on a plan

**STOP. The council never approves a plan, and neither does this skill.** APPROVE from the engine is advice; only the maintainer sets the status.

## Procedure

1. **Probe.** Once per session run `batuta capabilities 2>/dev/null | grep -q '"council"'`. Absent: tell the maintainer the council needs core `v1.1.0-beta.51` or later and stop. No manual substitute, no hand-made fan-out.
2. **Plan.** Take the plan the maintainer names, or the newest in `.batuta/plans/`. Its Status must be `proposed`. Any other status: stop and say so.
3. **Ignore check.** Run `git check-ignore -q .batuta/councils/`. Not ignored: warn that council artefacts would show up in git and point to `batuta-init`. Write nothing, neither `.gitignore` nor `.git/info/exclude`.
4. **Run.** `batuta council --plan <file> [--parallel N] [--timeout <duration>] [--out <dir>]`. Counsellors are the `council` rows of `.batuta/routing.md`, else the distinct non-self lane rows; the chairman is the `chairman` row, else the high lane. At least two counsellors. Three stages: independent critiques, anonymized cross-review, chairman synthesis.
5. **Exit.** `0` APPROVE, `2` REVISE (a result, not a failure), `4` INCOMPLETE (fewer than two critiques or cross-reviews parsed), `1` error before a report. On `4` list the failures from `council.md`, offer to rerun, and never treat INCOMPLETE as APPROVE or as a verdict. On `1` report the error and stop.
6. **Read.** Read `council.md` from the `--out` directory when one was given, else from `.batuta/councils/<date>-<plan slug>/`, on every exit that wrote a report, `4` included (`council.json` has the same data; the command also prints it). Engine findings are evidence, not the call.
7. **Judge.** Give every finding accept or decline with a one-line rationale. Show them as a list: finding, accept or decline, rationale.
8. **Propose.** For each accepted finding, write the edit to the plan as text. Do not touch the plan. After the maintainer agrees, hand the edits to `batuta-plan` to apply. The plan changes only after that agreement.
9. **Decide.** Recommend one of: apply the edits, rerun the council, or approve through `batuta-plan`. The maintainer decides. This skill never sets `Status: approved`, and the council never writes it.

*Done when:* the exit was named and every finding has accept or decline with a rationale; on INCOMPLETE, the failures are listed and a rerun offered.

Design source for the council shape: Andrej Karpathy's `llm-council`, design only.

This skill is read-only towards code and plans: it proposes edits and leaves the status to the maintainer.
