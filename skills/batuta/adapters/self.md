---
name: self
executable: none
run: self
readonly: self
available: "true"
models: declared
finished: self
---

# Adapter: self — the conducting host executes

Reserved for `critical`: tasks needing the conversation's full context,
security judgment or decisions still open. The most expensive lane; using
it for anything a cheaper lane can take defeats Batuta.

## Invocation

None. You, the session that is conducting, write the code — test-first
from the acceptance criteria, `references/method/debug.md` for bugs — then
run Step 4 exactly as for any executor. Self-review is not skipped.

## What `self` is per host

| Conducting host | `self` | The host's own CLI adapter then means |
|---|---|---|
| Claude Code | the Claude session | `claude.md` = background `claude -p` |
| Codex | the Codex session | `codex.md` = background `codex exec` |
| Cursor | the Cursor agent session | `cursor-agent.md` = background `cursor-agent -p` |
| Antigravity CLI | the agy session | `agy.md` = background `agy -p` |
| opencode | the opencode session | `opencode.md` = background `opencode run` |

A routing row never points `self` below `critical`. Cheaper lanes on the
same vendor use the vendor's CLI adapter with an explicit cheaper model.

## Cost

The host's subscription. Every task landing here justifies why the cheaper
lanes could not take it: classification, or escalation brought it.
