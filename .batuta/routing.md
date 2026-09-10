# Routing — batuta (host)

<!-- inputs: profile.md@sha256:4c7436960cc4 -->

Confirmed with the user by /batuta-init on 2026-09-06, same lanes as batuta-ai/core. Installed and probed: agy 1.1.27, claude 2.1.263, codex 0.153.4, cursor-agent, opencode 1.18.29; cursor-agent and opencode left unrouted by choice. Model IDs from `batuta inventory` on this machine.

| Lane | Domain | Executor | Model | Cost |
|---|---|---|---|---|
| low | * | agy | gemini-3.8-flash-low | free quota |
| medium | * | codex | gpt-5.6-sol | ChatGPT subscription |
| high | * | codex | gpt-6-astra | ChatGPT subscription, reasoning high |
| critical | * | self | — | host |

| Role | Executor | Model | Cost |
|---|---|---|---|
| research | agy | gemini-3.8-flash-low | free quota |
