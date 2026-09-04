---
name: codex
executable: codex
run: codex exec --sandbox workspace-write {cwd_flag} {model_flags} "{brief}" < /dev/null
run_file: codex exec --sandbox workspace-write {cwd_flag} {model_flags} "Follow the instructions in {brief_file}" < /dev/null
model_flags: -m {model} -c model_reasoning_effort="{effort}"
readonly: codex exec --sandbox read-only {cwd_flag} -m {model} "{prompt}" < /dev/null
available: command -v codex && codex login status
models: codex debug models --bundled
finished: exit_code
limit_regex: "rate limit reached|quota exceeded|usage limit reached|too many requests"
brief_limit_lines: 100
cwd_flag: --cd {cwd}
---

# Adapter: codex — OpenAI Codex CLI, non-interactive

Default executor for `medium`; with an explicit strong model and high
reasoning, also for `high`.

## Invocation notes

- `--sandbox workspace-write` lets it edit files inside the workspace and nowhere else. For riskier tasks, `--sandbox read-only` and apply the proposed diff yourself.
- `--cd {cwd}` targets a worktree without changing your own directory.
- `-m` picks the model; `-c model_reasoning_effort="<low|medium|high>"` the reasoning depth. Both together are the row's "explicit model". On `medium` with no effort in the row, drop the `-c` flag.
- `models` prints JSON; the IDs are `.models[].slug` and `.models[].supported_reasoning_levels[].effort`.

## Lanes

- **`medium`:** the CLI's default model, no flags. Under a subscription the per-task cost is flat; pinning buys nothing.
- **`high`:** the model must come from the row — the default may be a mid-tier model that silently downgrades the lane. At onboarding, suggest the strongest slug `models` lists and confirm once.
- On an API key instead of a subscription, cost is no longer flat: treat every lane's model as explicit and remember high reasoning multiplies spend.

## Capabilities and limits

Default model: isolated features, bugfixes with a clear repro, tests,
refactors scoped to a few files. Strong model + high reasoning: multi-file
features and refactors, as long as the brief is self-sufficient. Never:
open architecture decisions, security-sensitive changes, criteria that
need the conversation — those are `self`.

## Cost

ChatGPT subscription or OpenAI API key. Cheaper than the conducting host;
pricier than budget API models.

## Review invocation

The `readonly` line: the native sandbox blocks writes; the scout guard
applies as defense in depth. Model from the research row, not the `high`
row.
