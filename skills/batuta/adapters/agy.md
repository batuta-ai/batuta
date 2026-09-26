---
name: agy
executable: agy
run: agy -p "{brief}" --output-format stream-json {model_flags} --mode=accept-edits --dangerously-skip-permissions --sandbox --disable-slash-commands --print-timeout 30m < /dev/null
run_file: agy -p "Follow the instructions in {brief_file}" --output-format stream-json {model_flags} --mode=accept-edits --dangerously-skip-permissions --sandbox --disable-slash-commands --print-timeout 30m < /dev/null
model_flags: --model {model}
readonly: 'agy -p "Read-only task: do not create, edit or delete any file. {prompt}" --output-format stream-json --model {model} --dangerously-skip-permissions --sandbox --disable-slash-commands --print-timeout 15m < /dev/null'
available: command -v agy
models: agy models
finished: exit_code
output_decoder: agy-stream-json
limit_regex: "quota|rate limit|RESOURCE_EXHAUSTED|429|out of credits|provider error: .*(RESOURCE_EXHAUSTED|429)"
brief_limit_lines: 100
cwd_flag: env
---

# Adapter: agy — Google Antigravity CLI, non-interactive

Google's terminal agent (`agy`), multi-model: Gemini Flash and Pro, Claude,
GPT-OSS through one account. A cheap `low`/`medium` row with a Flash model,
or research with Flash on the free quota. Verified on `agy 1.1.26`.

## Invocation notes

- `-p` runs one prompt. `--mode=accept-edits` approves edits; `--dangerously-skip-permissions` also approves commands needed for tests. agy is not contained outside the worktree (probe 2026-09-23; kept by maintainer).
- `--print-timeout` defaults to 5 minutes; the `run` line raises it. Raise further for long suites.
- Run inside `{cwd}`; there is no cd flag.
- Slugs from `agy models` already carry the reasoning level (`gemini-3.8-flash-low`, `gemini-3.1-pro-high`, `claude-opus-4-6-thinking`): the row records the slug, not the display name, and that is the whole "explicit model". `--effort low|medium|high` exists for slugs without a level; add it to the row's flags only then.
- `--disable-slash-commands` keeps a `/` at the start of a brief line from expanding into a slash command. It also disables `--mode=plan` (agy 1.1.27 warns and ignores it), and headless `agy` auto-denies every `command` permission: the `readonly` line therefore runs with `--dangerously-skip-permissions --sandbox` and relies on the prompt's read-only contract plus the scout guard.
- `--output-format stream-json` feeds core's `output_decoder`: live text, usage, `provider …` failure lines. Responses go to stdout, diagnostics to stderr — capture them separately. Stderr glog lines prefixed `ERROR: logging before google.Init` on `I…` are INFO, not errors.
- `agy models` is a network call: run it at onboarding and on demand, never in a per-delegation availability check.
- Headless auth: keyring, or `GEMINI_API_KEY` with `modelProvider: "gemini"` in `~/.gemini/antigravity-cli/settings.json` (CI).

## Capabilities and limits

Flash `-low`: `low` and research `low`. Flash `-high`: `medium` and
research medium. Pro `-low`: `medium`. Pro `-high`, Claude thinking: `high`.
Budget models follow briefs literally; be exhaustive. Agy cannot see hidden directories.

## Cost

Google account quota or credits; flat under the plan, pay-per-use on an
API key. Check `/usage` in an interactive session.

## Review invocation

`--mode=plan` proposes without editing; the prompt states read-only anyway,
and the scout guard (`references/scout.md`) is the guarantee.
