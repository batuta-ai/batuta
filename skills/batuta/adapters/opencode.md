---
name: opencode
executable: opencode
run: opencode run --dir {cwd} --model {model} "{brief}" < /dev/null
run_file: opencode run --dir {cwd} --model {model} "Follow the instructions in {brief_file}" < /dev/null
model_flags: --model {model}
readonly: opencode run --dir {cwd} --model {model} "Read-only task: do not create, edit or delete any file. {prompt}" < /dev/null
available: command -v opencode && opencode models | grep -qx '{model}'
models: opencode models
finished: exit_code
limit_regex: "rate limit|quota|too many requests|insufficient credits"
brief_limit_lines: 100
cwd_flag: --dir {cwd}
---

# Adapter: opencode — any provider, any model, non-interactive

Default executor for `low`: the cheapest lane. Also the usual research
lane with a budget model.

## Invocation notes

- The model is mandatory and comes from the row or the user's override. Never the CLI's global default — it is whatever the user last configured and may be a premium model.
- IDs are `provider/model` and vary per installation (`opencode/kimi-k2.5`, `openrouter/moonshotai/kimi-latest`). Never write one from memory: discover it.
- `--format json` gives raw events when a log is needed.

## Model discovery

`opencode models` lists only models from providers with credentials — its
output is exactly the set of valid `--model` values. Shortlist the cheap
lane instead of showing hundreds:

```bash
opencode models | grep -iE 'kimi|deepseek|glm|qwen|flash|mini|free'
```

Suggest two or three, let the user confirm one, record only the confirmed
ID. A verbal override ("use kimi") resolves the same way:
`opencode models | grep -i kimi`. A recorded model no longer listed →
re-discover and re-confirm before delegating; never substitute silently.

## Capabilities and limits

Good at renames, config, copy, simple tests, small well-specified
single-file changes. Budget models follow briefs literally — the brief must
be exhaustive and may prescribe the how (`brief.md`, sweep exception).
Avoid anything ambiguous or multi-file.

## Cost

Pay-per-use API of the chosen model — typically cents with Kimi, DeepSeek
or GLM. The cheapest adapter; that is its role.

## Review invocation

opencode has no native read-only mode: the `readonly` line states it in the
prompt, and the scout guard (`references/scout.md`) is the actual guarantee.
