# Adapter: opencode

opencode CLI running non-interactively, with a configurable model (Kimi,
DeepSeek, etc.). Default executor for trivial tasks — the cheapest lane.

## Invocation

```bash
opencode run --model <provider/model> "<brief>"
```

- Run from the project root.
- The model MUST come from the routing table row or a user override
  ("use kimi for this"). Never fall back to the CLI's global default — it is
  whatever the user last configured and may point at an expensive premium
  model, silently defeating the cost routing. If the routing row has no model,
  ask the user once and record the answer in `.batuta/routing.md`.
- Examples: `opencode run --model moonshotai/kimi-k2 "<brief>"`,
  `opencode run --model deepseek/deepseek-chat "<brief>"`.

## Context passing

Brief goes inline as the argument. For long briefs, write to a temp file and
instruct the model to read it first:

```bash
batuta_brief=$(mktemp) && cat > "$batuta_brief" <<'EOF'
<brief>
EOF
opencode run --model <provider/model> "Follow the instructions in $batuta_brief"
```

## Capabilities and limits

- Good at: renames, config changes, copy edits, simple unit tests, small
  well-specified single-file changes.
- Avoid delegating: anything ambiguous, multi-file work, tasks whose acceptance
  criteria require judgment. Budget models follow briefs literally — the brief
  must be exhaustive.

## Cost

Pay-per-use API of the chosen model — typically cents per task with Kimi or
DeepSeek. The cheapest adapter; that is its role.

## Availability check

```bash
command -v opencode
opencode auth list
```
