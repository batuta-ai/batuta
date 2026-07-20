# Adapter: claude

The orchestrator itself executes the task. Reserved for critical work — tasks
needing the conversation's full context, security judgment, or decisions still
open. This is the most expensive lane, and using it for anything a cheaper
lane can take defeats Batuta's purpose.

## Invocation

No external command in the common case: the current orchestrator session writes
the code directly, then proceeds to verification as usual (self-review is not
skipped — run tests and acceptance criteria checks exactly like for any
executor).

For parallel work, spawn a background instance instead:

```bash
claude -p "<brief>" --permission-mode acceptEdits
```

## Model selection

Common case: the session's model applies — there is nothing to pin. Background
instances accept `--model <model>` (e.g. `claude -p --model sonnet "<brief>"`);
a routing row may use that to create an intermediate Claude lane (a cheaper
Claude model for tasks that deserve Claude but not the top model). In
claude-only setups this is how the whole table works: lower lanes run cheaper
Claude models via background instances (haiku for trivial, sonnet for
medium/complex), and only the critical lane is the session itself. If a row
names a Claude model, it follows the explicit-model rule: the row records it,
the invocation passes it.

Note for future orchestrator-agnostic versions: this adapter means "the
orchestrating tool executes", whatever that tool is — nothing here may assume
Claude specifically beyond the invocation line above.

## Context passing

Common case: none needed — the orchestrator already holds the conversation
context. Background instance: brief inline via `-p`, or written to a file the
prompt points at.

## Capabilities and limits

- Good at: architecture, security-sensitive work, tasks that need the
  conversation's full context or real judgment.
- Avoid: anything a cheaper lane can do — check the routing table first.
  Multi-file work alone no longer lands here: if a self-sufficient brief can
  specify it, it belongs to the Complex row (codex + strong model).

## Cost

The user's Claude subscription — the most expensive lane. Every task landing
here should justify why the cheaper lanes couldn't take it (usually: the
routing table classified it critical, or escalation brought it here).

## Availability check

Always available in the common case (the orchestrator is already running).
Background instance:

```bash
command -v claude
```
