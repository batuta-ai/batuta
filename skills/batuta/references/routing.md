# Routing — lanes, rules, defaults

This file is the default. `/batuta-init` writes the project's own
`.batuta/routing.md` with real executors and model IDs; the project copy
always wins. It is a markdown table — edit freely.

## Contents

- Taxonomy
- Default table
- Rules
- Support lane: research
- Adapters

## Taxonomy

**Complexity** — one of four:

| Lane | Intent | Minimum posture |
|---|---|---|
| `low` | contained change, well-trodden path: rename, config, copy, simple test | cheapest coding-capable model |
| `medium` | isolated feature, bugfix with clear repro, new interface with moderate coordination | mid-tier coding model; raise reasoning before raising cost |
| `high` | new subsystem, multi-file feature or refactor that a precise brief can fully specify | strong coding model, high reasoning |
| `critical` | architecture, security-sensitive work, anything needing the conversation's context or open decisions | the conducting host itself (`self`) |

**Domain** — one of: `backend, frontend, mobile, data, infra, security,
testing, docs, general, fullstack`. Domain is a routing discriminator: a row
may name a different executor per domain (e.g. `frontend` → cursor-agent).
Rows without a domain apply to all.

High vs critical is the **brief test**, not size: self-sufficient brief →
`high`; needs the conversation → `critical`. In doubt, `critical`: a wrong
`high` costs a failed delegation cycle; a wrong `critical` costs only the
price difference.

## Default table

Assumes the full set is installed. Onboarding adapts it to what exists.

| Lane | Domain | Executor | Model | Cost |
|---|---|---|---|---|
| low | * | opencode | `<provider/model>` set at onboarding (kimi, deepseek, glm…) | cents (API) |
| medium | * | codex | default model | ChatGPT subscription |
| high | * | codex | `<strongest model>`, reasoning high, set at onboarding | ChatGPT subscription |
| critical | * | self | the session's model | host subscription |

## Rules

- Classify alone and announce in one line: `→ codex/gpt-5.6-sol: medium backend — <title>`.
- The user overrides verbally at any time. Obey.
- **Escalation:** two failed verifications (original + 1 retry) → one row up.
- **Unavailable executor** (not installed, not logged in, model not listed) → one row up. Say so.
- **Explicit model:** every row names the exact model ID the CLI accepts. Never the CLI's global default — it is whatever the user last touched and may be a premium model, silently defeating cost routing. Exception: codex under a subscription has flat per-task cost, so its default is acceptable on `medium` only. On `high` the model is a capability knob and must be explicit.
- **Discover, never recall:** model IDs come from the adapter's `models` command on this machine, confirmed once at onboarding. Never write an ID from memory.
- **`self` is the host that conducts.** In Claude Code, `self` is the Claude session and `claude.md` means a background `claude -p`. In Codex, `self` is the Codex session and `codex.md` means a background `codex exec`. Rows never point `self` below `critical`.
- **Dormant adapters:** the table references, the adapter sleeps. During a cycle an adapter is read only when its row is routed to or added. Onboarding and reconfigure (`batuta-init`) probe every adapter shipped in `adapters/`; nothing ever probes a CLI outside that directory.

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
