# Adapter: claude

The orchestrator itself executes the task. Reserved for complex work — this is
the most expensive lane, and using it for trivial/medium tasks defeats Batuta's
purpose.

## Invocation

No external command in the common case: the current orchestrator session writes
the code directly, then proceeds to verification as usual (self-review is not
skipped — run tests and acceptance criteria checks exactly like for any
executor).

For parallel work, spawn a background instance instead:

```bash
claude -p "<brief>" --permission-mode acceptEdits
```

Note for future orchestrator-agnostic versions: this adapter means "the
orchestrating tool executes", whatever that tool is — nothing here may assume
Claude specifically beyond the invocation line above.

## Context passing

Common case: none needed — the orchestrator already holds the conversation
context. Background instance: brief inline via `-p`, or written to a file the
prompt points at.

## Capabilities and limits

- Good at: multi-file changes, architecture, security-sensitive work, tasks that
  need the conversation's full context or real judgment.
- Avoid: anything a cheaper lane can do — check the routing table first.

## Cost

The user's Claude subscription — the most expensive lane. Every task landing
here should justify why the cheaper lanes couldn't take it (usually: the
routing table classified it complex, or escalation brought it here).

## Availability check

Always available in the common case (the orchestrator is already running).
Background instance:

```bash
command -v claude
```
