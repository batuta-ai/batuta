# Adapter: <executor name>

Contract for a Batuta executor. Copy this file to `adapters/<name>.md` (or
`.batuta/adapters/<name>.md` in a project — that path takes precedence), fill in
every section, then add a row to the routing table.

Adapters are dormant: this file is only read when its routing row is used, so
an unused adapter costs zero context. Keep it that way — stay around 50 lines
(discovery commands over hardcoded catalogs; no model lists pasted in), and
never make any skill load adapters the routing table doesn't reference.

## Invocation

Exact non-interactive command the orchestrator runs via Bash. The command must
finish on its own — no prompts, no TUI.

```bash
<cli> <exec-subcommand> [flags] "<brief>"
```

Notes: working directory expectations, flags that control write access/sandbox,
how to select a model (if configurable).

## Context passing

How the brief is delivered: inline argument, file path, or stdin. State the
practical size limit and what to do when the brief exceeds it (e.g. write the
brief to a temp file and pass the path).

## Capabilities and limits

- Recommended task size (e.g. single-file edits, small features).
- What to avoid delegating (e.g. multi-file refactors, anything needing project
  history).

## Cost

Subscription or pay-per-use, and roughly how it compares to the other adapters.
This feeds the routing table's Cost column.

## Availability check

Commands the orchestrator runs to confirm the executor is usable before
delegating (installed, authenticated):

```bash
command -v <cli>
<cli> <auth-status-subcommand>
```
