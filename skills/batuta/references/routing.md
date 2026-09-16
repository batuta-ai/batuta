# Routing — lanes, rules, defaults

Default only: `/batuta-init` writes project `.batuta/routing.md` with real
executors/models, and that editable table wins.

## Contents

- Taxonomy
- Default table
- Rules
- Support lane: research
- Adapters

## Taxonomy

**Complexity:**

| Lane | Intent | Minimum posture |
|---|---|---|
| `low` | contained rename/config/copy/simple test | cheapest coder |
| `medium` | isolated feature, clear bug, moderately coordinated interface | mid-tier; raise reasoning before cost |
| `high` | subsystem/multi-file work fully captured by a precise brief | strong model, high reasoning |
| `critical` | architecture, security or work needing conversation/open decisions | host (`self`), or strong CLI when loop-first |

**Domain:** `backend, frontend, mobile, data, infra, security, testing, docs,
general, fullstack`. Rows may select executors by domain; no domain means all.

High vs critical is the **brief test**, not size: self-sufficient → `high`;
conversation-dependent → `critical`. In doubt, `critical`.

## Default table

Onboarding adapts this assumed full installation.

| Lane | Domain | Executor | Model | Cost |
|---|---|---|---|---|
| low | * | opencode | `<provider/model>` set at onboarding (kimi, deepseek, glm…) | cents (API) |
| medium | * | codex | default model | ChatGPT subscription |
| high | * | codex | `<strongest model>`, reasoning high, set at onboarding | ChatGPT subscription |
| critical | * | self | the session's model | host subscription |

Loop-first seats `critical` on a strong CLI; open decisions park with `BATUTA-QUESTION`.

## Rules

- Classify and announce: `→ codex/gpt-5.6-sol: medium backend — <title>`.
- User overrides always win.
- Freeze executor, model and effort before choosing transport; see `dispatch.md`.
- **Escalation:** two failed verifications (original + 1 retry) → one row up.
- **Unavailable executor** (install/login/model) → announce, then one row up.
- **Explicit model:** every row names the exact model ID the CLI accepts. Never the CLI's global default — it is whatever the user last touched and may be a premium model, silently defeating cost routing. Exception: codex under a subscription has flat per-task cost, so its default is acceptable on `medium` only. On `high` the model is a capability knob and must be explicit.
- **Discover, never recall:** onboarding confirms model IDs via adapter `models`.
- **`self` is the host that conducts.** In Claude Code, `self` is the Claude session and `claude.md` means a background `claude -p`. In Codex, `self` is the Codex session and `codex.md` means a background `codex exec`. Rows never point `self` below `critical`.
- **Dormant adapters:** read only the routed/added adapter. Onboarding/reconfigure probes every shipped adapter and no outside CLI.

## Support lane: research

Orthogonal to the ladder. The escalation rule does not apply.

| Role | Examples | Executor | Cost |
|---|---|---|---|
| research | project map sweep, brief context, "where does X live?" | `<CLI + cheap model>` set at onboarding (opencode + kimi, `claude -p --model haiku`) | cents |

- Read-only, contract in `scout.md`. Never writes code, never commits, never appears in `WORK.md`.
- Scout failed twice or unavailable → you research yourself. Nothing escalates.

## Adapters

One file per executor at `adapters/<executor>.md`; the project may override
with `.batuta/adapters/<executor>.md`. The YAML frontmatter is the machine
contract (`run`, `readonly`, `available`, `models`, `finished`,
`limit_regex`); the prose is for you. New executor: copy
`adapters/_template.md`, fill the frontmatter, add a row.
