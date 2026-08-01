# Codex plugin integration — borrowed muscle, Batuta's rules

How the maestro conducts the cycle when the
[codex companion plugin](https://github.com/openai/codex-plugin-cc) is
installed in Claude Code. Dormant like the adapters: skills point here in
one line; read this file only when a pointer fires.

## Universal rules

- **Detection:** at runtime, at the moment of conducting the step — the
  plugin is installed when `codex:*` skills appear in the session's
  available skills. No hard dependency: absent → the step runs exactly as
  the skill's own text describes. The skills' baseline text IS the
  degradation path; this file only changes *how* a step is conducted,
  never *what* it delivers.
- **Authority:** the plugin supplies *muscle* — transport, diagnosis, a
  second reviewer's eyes, prompt-writing method. Batuta supplies the
  rules: the plugin never decides routing, never commits, never issues
  the Step 4 verdict. The routing row's model and reasoning flags remain
  mandatory on every invocation.
- **Two-level availability:** the plugin being installed does not replace
  the executor check (`adapters/codex.md`: `command -v codex`,
  `codex login status`). Plugin present with the CLI missing or logged
  out → the codex lane is unavailable and routing's rule applies (one
  row up); rescue and cross-review are unavailable too and degrade per
  their own bullets below. The plugin's stop-time review gate is the
  user's own setting — it never participates in the cycle.

## Map — cycle moment → plugin capability → what Batuta keeps

| Cycle moment | Plugin capability | What Batuta keeps |
| --- | --- | --- |
| Brief for the codex lane (Step 2) | `gpt-5-4-prompting` (writing method) | brief structure (Goal/Context/Conventions/Criteria/Boundaries/Scope/Expected evidence/Stop conditions), the superpowers method line, self-sufficiency |
| Delegation on the codex lane (Step 3) | shared runtime (`codex-cli-runtime`, `codex-result-handling`) | the routing row's model and reasoning flags; the cycle's worktree and parallelism; without the plugin → `codex exec` per the adapter |
| Failed retry, before escalating (Step 4) | `codex:rescue` (root-cause diagnosis) | the escalation ladder (one row up); the diagnosis only enriches the re-brief |
| Verifying a complex/critical item (Step 4) and `/batuta:review` | Codex review (second opinion) | the brief's criteria, the traceability test, the maestro's verdict |

### Adaptation per moment

- **Brief (Step 2):** when the routed lane is codex, consult
  `gpt-5-4-prompting` and apply its advice to the brief's wording. The
  plugin improves the *form*; the Step 2 contract (structure, content,
  self-sufficiency, method line) is unchanged. Non-codex lanes → brief as
  the skill describes, nothing consulted.
- **Delegation (Step 3):** codex lane + plugin present → invoke through
  the plugin's shared runtime, per its runtime skills, carrying the
  routing row's model and reasoning (same rule as the adapter: an
  invocation without the row's flags is a routing bug). The cycle's
  worktree and parallelism apply unchanged — the runtime is transport; it
  does not change where the executor works. The scout's research
  invocation may also use the runtime when its lane points at codex,
  keeping read-only mode and the universal guard. Without the plugin →
  `codex exec` per `adapters/codex.md`.
- **Rescue (Step 4):** the item failed verification and the retry failed
  too → before escalating, dispatch `codex:rescue` with the brief, the
  attempt's diff and the failure feedback; its diagnosis goes into the
  Context section of the escalation's re-brief. The rescue never
  implements the fix — the next row's executor does, through the normal
  cycle. Rescue unavailable or inconclusive → escalate as the skill
  describes, without a diagnosis. With superpowers installed,
  `systematic-debugging` still conducts critical-bugfix and
  post-escalation investigation (`superpowers.md`); the rescue is the
  earlier, cheaper rung at the first escalation. The dispatch asks for
  diagnosis only, no code changes — apply the scout's universal read-only
  guard (`skills/batuta/SKILL.md`, "The scout"): `git status --porcelain`
  baseline before dispatch, compared after; any new or changed entry gets
  reverted and the run counts as failed.
- **Cross-review (Step 4 / `/batuta:review`):** on items classified
  complex or critical, after the maestro's diff review and before the
  verdict, request a Codex review of the item's diff, conducted per the
  cross-review contract in `verification.md` — lens count by diff size,
  findings file outside the repo, spec artifacts included verbatim, and
  the maestro's accept/reject judgment. Accepted findings are a normal
  verification failure (retry with feedback). On trivial and medium
  items, never automatic — only when the user asks or inside
  `/batuta:review`. Cross-review unavailable → Step 4 stands on its own.
  The verdict is always the maestro's. The dispatch asks for an opinion
  only, no code changes — apply the scout's universal read-only guard
  (`skills/batuta/SKILL.md`, "The scout") the same way.
