# Routing — default table

This is Batuta's default routing table. To customize it for a project, copy this
file to `.batuta/routing.md` in the project repo — the local copy takes
precedence. Edit freely: it is just a markdown table.

The table assumes the full trio (opencode + codex + claude). Onboarding adapts
it to what the user actually has and prefers — a claude-only setup, for
instance, maps lanes to different Claude models instead (see
`skills/batuta/SKILL.md`, Step 0.6). The executor column of the project's
local copy is the user's choice, not this default.

| Complexity | Examples | Executor | Cost |
|---|---|---|---|
| Trivial | rename, config, copy change, simple unit test | opencode + `<provider/model>` set at onboarding (e.g. kimi, deepseek) | cents (API) |
| Medium | isolated feature, bugfix with clear repro | codex (default model) | ChatGPT subscription |
| Complex | multi-file feature/refactor that a precise brief can fully specify | codex + `<strong model>` with high reasoning, set at onboarding | ChatGPT subscription |
| Critical | architecture decisions, security-sensitive work, tasks needing the conversation's full context or real judgment | claude | Claude subscription |

## Rules

- The orchestrator classifies on its own and announces it in one line:
  `→ codex: medium bugfix`.
- The user can override verbally at any time ("use kimi for this").
- **Automatic escalation:** if the executor fails verification twice (original
  attempt + 1 retry with feedback), the task moves one row up the table.
- Executor unavailable (CLI not installed / not logged in) → use the next row up.
- Each executor maps to an adapter at `adapters/<executor>.md`.
- **Dormant adapters:** the table references, the adapter sleeps. An adapter
  is only read when its row is routed to (delegation) or explicitly added to
  the table (onboarding/`/batuta:route`). Never scan, check, or load adapters
  the active table doesn't reference — extra CLIs on the user's machine
  (cursor, copilot, kimi CLI, …) cost zero context until the user opts a row
  in. This is what keeps Batuta cheap as the adapter catalog grows; don't
  break it when adding executors.
- **Complex vs Critical:** the dividing line is the brief, not the size. If a
  self-sufficient brief can carry everything the executor needs (file list,
  decisions already made, verifiable acceptance criteria), the task is Complex
  and delegable to the Complex row's executor with a strong model. If the task
  needs the conversation's context, security judgment, or decisions that are
  still open, it is Critical and stays with claude. When in doubt, classify
  Critical — a wrong Complex costs a failed delegation cycle; a wrong Critical
  only costs the price difference.
- **Complex-lane executor is a user choice:** the default (full trio) is codex
  with a strong model, but at onboarding the user may map the row to a strong
  Claude model via background instance instead (`claude -p --model opus
  "<brief>"`, see `adapters/claude.md`) — heavy-logic work that passes the
  brief test doesn't need the session's top model, and some users prefer
  Claude's strong models over codex for it. Either way the row names the exact
  model. This choice never absorbs Critical: a background instance has no
  access to the conversation, so anything needing that context stays with the
  session regardless of which executor owns Complex.
- **Explicit model:** for multi-model CLIs (opencode), the row must name the
  exact `provider/model` ID — never rely on the CLI's global default, which is
  whatever the user last configured and may point at an expensive premium
  model, silently defeating the cost routing. IDs vary per installation, so
  they are discovered via `opencode models` (see `adapters/opencode.md`) and
  confirmed once at onboarding — this default table carries a placeholder;
  the project's `.batuta/routing.md` carries the real ID. Exception: codex
  under a subscription has flat per-task cost, so its default model is
  acceptable on the Medium row. The Complex row is different: there the model
  choice is a capability knob, so the row must still name the exact model and
  reasoning effort (see `adapters/codex.md`), confirmed at onboarding —
  delegating complex work to codex's default model silently downgrades the
  lane's capability.
