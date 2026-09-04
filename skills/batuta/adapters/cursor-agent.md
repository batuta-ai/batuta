---
name: cursor-agent
executable: cursor-agent
run: cursor-agent -p --force --trust --workspace {cwd} {model_flags} --output-format text "{brief}" < /dev/null
run_file: cursor-agent -p --force --trust --workspace {cwd} {model_flags} --output-format text "Follow the instructions in {brief_file}" < /dev/null
model_flags: --model {model}
readonly: cursor-agent -p --mode ask --trust --workspace {cwd} --model {model} --output-format text "{prompt}" < /dev/null
available: command -v cursor-agent && cursor-agent --list-models
models: cursor-agent --list-models
finished: exit_code
limit_regex: "rate limit|usage limit|quota|too many requests"
brief_limit_lines: 100
cwd_flag: --workspace {cwd}
---

# Adapter: cursor-agent — Cursor's agent, non-interactive

Multi-vendor executor (GPT, Claude, Grok, Gemini through one subscription).
A natural `frontend` row.

## Invocation notes

- `-p` (`--print`) is the non-interactive mode with full tool access; `--force` (alias `--yolo`) stops it from stalling on command approval; `--trust` skips the workspace-trust prompt.
- `--workspace {cwd}` targets a worktree. Cursor also has its own `-w` worktrees; do not mix them with Batuta's.
- Model IDs come from `--list-models`. Parameterized models accept bracket overrides: `'claude-opus-4-8[context=1m,effort=high,fast=false]'` — record the whole string in the row when the row needs effort.
- `--mode ask` is the read-only mode (Q&A, no edits); `--mode plan` also stays read-only but proposes plans — use `ask` for scouts and verifiers.
- `--output-format json` when a log is needed.

## Capabilities and limits

Strong on UI work and multi-file edits with a clear brief. Same limits as
any background executor: nothing that needs the conversation.

## Cost

Cursor subscription. Flat per task under the plan; model choice is a
capability knob.

## Review invocation

The `readonly` line with `--mode ask`. Native read-only plus the scout
guard.
