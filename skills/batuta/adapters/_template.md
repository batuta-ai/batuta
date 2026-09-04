---
name: <executor>            # matches the routing table's Executor column
executable: <cli>           # what `command -v` must find
run: <cli> <exec-subcommand> {model_flags} "{brief}"
run_file: <cli> <exec-subcommand> {model_flags} "Follow the instructions in {brief_file}"
model_flags: --model {model}
readonly: <cli> <exec-subcommand> --read-only-flag --model {model} "{prompt}"
available: command -v <cli> && <cli> <auth-status>
models: <cli> <list-models>        # or `declared` when the CLI cannot list
finished: exit_code                # or: last_result_event
limit_regex: "rate limit|usage limit|quota exceeded|too many requests"
brief_limit_lines: 100             # above this, use run_file
cwd_flag: --cd {cwd}               # or `env` when the CLI only honors the process cwd
---

# Adapter: <executor>

Copy to `adapters/<executor>.md` (or `.batuta/adapters/<executor>.md` in a
project — that path wins), fill the frontmatter, add a row to the routing
table. Adapters are dormant: read only when their row is routed to. Keep
under 60 lines; discovery commands over pasted model lists.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `{brief}` | the brief inline, shell-quoted |
| `{brief_file}` | path of a temp file holding the brief |
| `{prompt}` | a read-only prompt (scout, verifier, reviewer) |
| `{model}` | the routing row's model ID |
| `{effort}` | the routing row's reasoning effort, when it names one |
| `{model_flags}` | this file's `model_flags` line, expanded |
| `{cwd}` | the task's working directory (worktree or checkout) |

## Invocation notes

Working directory, sandbox flags, how the model is selected, stdin
behavior (close it with `< /dev/null` when the CLI reads a non-TTY stdin).

## Capabilities and limits

Recommended task size; what never to delegate here.

## Cost

Subscription or pay-per-use, relative to the other adapters.

## Review invocation

How this executor serves as second reviewer or verifier: the `readonly`
line plus the findings-file instruction.
