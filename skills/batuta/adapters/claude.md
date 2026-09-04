---
name: claude
executable: claude
run: env -u CLAUDECODE claude -p --permission-mode acceptEdits {model_flags} "{brief}" < /dev/null
run_file: env -u CLAUDECODE claude -p --permission-mode acceptEdits {model_flags} "Follow the instructions in {brief_file}" < /dev/null
model_flags: --model {model}
readonly: env -u CLAUDECODE claude -p --model {model} --disallowedTools "Write,Edit,NotebookEdit" "{prompt}" < /dev/null
available: command -v claude
models: declared
finished: exit_code
limit_regex: "usage limit reached|hit your (session|usage|.-hour) limit|.-hour limit reached|\"api_error_status\": 429"
brief_limit_lines: 100
cwd_flag: env
---

# Adapter: claude — Claude Code in the background

A headless `claude -p` instance. Never the session that is conducting —
that is `self.md`.

## Invocation notes

- `< /dev/null` is mandatory: `claude -p` reads stdin when it is not a TTY and would consume whatever the caller is piping.
- `env -u CLAUDECODE` removes the nested-session marker when the conductor is itself Claude Code.
- Working directory: run the command inside `{cwd}`; there is no cd flag.
- `--output-format stream-json --verbose` gives a per-event log; then `finished` becomes the last `"type":"result"` event with `is_error: false`. Only the last one — earlier `is_error` events are tool results, not failures.
- Model aliases (`haiku`, `sonnet`, `opus`) are accepted; the row records the alias it confirmed.

## Lanes

- **Cheap Claude lanes** (a claude-only setup): `haiku` for `low`, `sonnet` for `medium`, `opus` for `high`. The row names the alias; the invocation passes it.
- **`high` on a strong Claude model** instead of codex: the user's choice at onboarding. The limit is context, not capability — a background instance never sees the conversation, so this fits only what a self-sufficient brief carries.

## Capabilities and limits

Good at anything a brief can carry. Never a substitute for `self` when the
task needs the conversation.

## Cost

The user's Claude subscription. Cheaper than the session only when the row
names a cheaper model.

## Review invocation

The `readonly` line with a cheap model. Bash stays available for `grep` and
`ls`; the scout guard (`references/scout.md`) covers writes attempted
through it. The findings-file instruction goes in `{prompt}`.
