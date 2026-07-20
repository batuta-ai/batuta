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
  run the model discovery below, ask the user once and record the answer in
  `.batuta/routing.md`.
- Model IDs vary per installation and per provider (the same model can appear
  as `opencode/kimi-k2.5` or `openrouter/~moonshotai/kimi-latest`). Never
  hardcode an ID from memory — discover it.

## Model discovery

The CLI is the source of truth for what exists on this machine:

```bash
opencode providers list      # providers with configured credentials
opencode models              # every available model, already in provider/model format
opencode models <provider>   # filter by provider
```

`opencode models` only lists models from providers with credentials, so its
output is exactly the set of valid `--model` values. To map the cheap lane,
filter it down to a shortlist instead of showing hundreds of entries:

```bash
opencode models | grep -iE 'kimi|deepseek|glm|qwen|flash|mini|free'
```

Suggest 2–3 candidates from the shortlist, let the user confirm one, and
record only the confirmed ID in `.batuta/routing.md`. When the user overrides
verbally ("use kimi for this"), resolve the informal name to an exact ID the
same way: `opencode models | grep -i kimi`.

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
opencode providers list
opencode models | grep -qx '<provider/model from the routing row>'
```

If the recorded model is no longer listed (credential removed, provider
renamed the ID), re-run model discovery and re-confirm with the user before
delegating — never fail mid-task or silently substitute another model.
