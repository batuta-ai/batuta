---
name: claude
executable: claude
run: env -u CLAUDECODE claude -p --output-format stream-json --verbose --permission-mode acceptEdits --settings '{"sandbox":{"enabled":true,"autoAllowBashIfSandboxed":true},"permissions":{"allow":["Edit(./**)"]}}' {model_flags} "{brief}" < /dev/null
run_file: env -u CLAUDECODE claude -p --output-format stream-json --verbose --permission-mode acceptEdits --settings '{"sandbox":{"enabled":true,"autoAllowBashIfSandboxed":true},"permissions":{"allow":["Edit(./**)"]}}' {model_flags} "Follow the instructions in {brief_file}" < /dev/null
model_flags: --model {model}
readonly: env -u CLAUDECODE claude -p --output-format stream-json --verbose --model {model} --settings '{"sandbox":{"enabled":true,"autoAllowBashIfSandboxed":true}}' --disallowedTools=Write,Edit,NotebookEdit "{prompt}" < /dev/null
available: command -v claude
models: declared
finished: exit_code
output_decoder: claude-stream-json
limit_regex: "usage limit reached|hit your (session|usage|.-hour) limit|.-hour limit reached|\"api_error_status\": 429|provider limit: [a-z_]+ rejected|provider error: api_error_status 429"
brief_limit_lines: 100
cwd_flag: env
acp_run: claude-agent-acp
acp_version: 0.81.1
acp_model_config: model
acp_mode: acceptEdits
acp_session_meta: {"claudeCode":{"options":{"sandbox":{"enabled":true,"autoAllowBashIfSandboxed":true}}}}
---

# Adapter: claude — Claude Code in the background

A headless `claude -p` instance. Never the session that is conducting —
that is `self.md`.

## Invocation notes

- `< /dev/null` is mandatory: `claude -p` reads stdin when it is not a TTY and would consume whatever the caller is piping.
- `env -u CLAUDECODE` removes the nested-session marker when the conductor is itself Claude Code.
- Working directory: run the command inside `{cwd}`; there is no cd flag.
- `--output-format stream-json --verbose` feeds `output_decoder`: text, usage, `provider …` failures.
- Model aliases (`haiku`, `sonnet`, `opus`, `fable`) are accepted; the row records the alias it confirmed.
- `acceptEdits`, sandbox `--settings` and the `Edit(./**)` rule keep the run in the worktree: free inside, blocked outside. Without the rule, headless `claude -p` stopped on a new file. Network and outside writes may be refused.

## Lanes

- **Cheap Claude lanes** (a claude-only setup): `haiku` for `low`, `sonnet` for `medium`, `opus` for `high`. The row names the alias; the invocation passes it.
- **`high` on a strong Claude model** instead of codex: the user's choice at onboarding. The limit is context: a background instance never sees the conversation, so only a self-sufficient brief fits.

## Capabilities and limits

Good at anything a brief can carry. Never a substitute for `self` when the
task needs the conversation.

ACP: `acp_run: claude-agent-acp` (bridge 0.81.1) starts sessions in mode
`acp_mode: acceptEdits`; `acp_session_meta` enables the sandbox with bash
auto-allow, containing writes to the worktree. Effort follows the
session's `thought_level`, so no `acp_effort_config` is declared.

## Cost

The user's Claude subscription. Cheaper than the session only when the row
names a cheaper model.

## Review invocation

The `readonly` line with a cheap model. Bash stays available for `grep` and
`ls`; the scout guard (`references/scout.md`) covers writes attempted
through it. The findings-file instruction goes in `{prompt}`.
