# Routing — default table

This is Batuta's default routing table. To customize it for a project, copy this
file to `.batuta/routing.md` in the project repo — the local copy takes
precedence. Edit freely: it is just a markdown table.

| Complexity | Examples | Executor | Cost |
|---|---|---|---|
| Trivial | rename, config, copy change, simple unit test | opencode + `moonshotai/kimi-k2` | cents (API) |
| Medium | isolated feature, bugfix with clear repro | codex (default model) | ChatGPT subscription |
| Complex | multi-file, architecture, security | claude | Claude subscription |

## Rules

- The orchestrator classifies on its own and announces it in one line:
  `→ codex: medium bugfix`.
- The user can override verbally at any time ("use kimi for this").
- **Automatic escalation:** if the executor fails verification twice (original
  attempt + 1 retry with feedback), the task moves one row up the table.
- Executor unavailable (CLI not installed / not logged in) → use the next row up.
- Each executor maps to an adapter at `adapters/<executor>.md`.
- **Explicit model:** for multi-model CLIs (opencode), the row must name the
  model — never rely on the CLI's global default, which is whatever the user
  last configured and may point at an expensive premium model, silently
  defeating the cost routing. Exception: codex under a subscription has flat
  per-task cost, so its default model is acceptable there.
