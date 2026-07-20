# Adapter: codex

OpenAI's Codex CLI running non-interactively. Default executor for medium
tasks; with an explicit strong model, also the executor for complex tasks.

## Invocation

Medium lane (default model):

```bash
codex exec --sandbox workspace-write "<brief>"
```

Complex lane (explicit model + high reasoning, from the routing row):

```bash
codex exec --sandbox workspace-write -m <model> -c model_reasoning_effort="high" "<brief>"
```

- Run from the project root; `workspace-write` lets it edit files but not leave
  the workspace.
- Add `--cd <path>` to target another directory instead of cd-ing.
- For riskier tasks, downgrade to `--sandbox read-only` and apply the proposed
  diff manually.

## Model selection

- `-m <model>` picks the model; `-c model_reasoning_effort="<low|medium|high>"`
  sets reasoning depth. Both count as the "explicit model" of a routing row —
  record them together (e.g. `codex -m gpt-5-codex, reasoning high`).
- **Medium lane:** the CLI's default model, no flags. Under a subscription the
  per-task cost is flat, so pinning a model there buys nothing.
- **Complex lane:** the model MUST come from the routing row — never rely on
  the CLI's default, which may be a mid-tier model that silently downgrades
  the lane. The row is born at onboarding: suggest the strongest model the
  account offers (check `codex --help` / the CLI's model list for what this
  installation accepts; don't hardcode names from memory) and confirm with
  the user once.
- User overrides ("use o3 for this") work like everywhere else: resolve to the
  exact model name and record the routing story in `WORK.md`.

## Context passing

Brief goes inline as the argument. For long briefs (> ~100 lines), write the
brief to a file and reference it:

```bash
batuta_brief=$(mktemp) && cat > "$batuta_brief" <<'EOF'
<brief>
EOF
codex exec --sandbox workspace-write "Follow the instructions in $batuta_brief"
```

## Research invocation

For the Research support lane: native read-only sandbox, model from the
Research row (small/cheap — this is not the complex lane's strong model):

```bash
codex exec --sandbox read-only -m <model> "<research brief>"
```

The sandbox blocks writes; still apply the universal guard from
`skills/batuta/SKILL.md` ("The scout") as defense in depth.

## Capabilities and limits

- Default model — good at: isolated features, bugfixes with a clear repro,
  tests, refactors scoped to a few files.
- Strong model + high reasoning — also good at: multi-file features and
  refactors, as long as the brief is self-sufficient (precise file list,
  decisions already made, verifiable acceptance criteria).
- Never delegate, regardless of model: architecture decisions still being
  discussed, security-sensitive changes, tasks whose acceptance criteria
  require the conversation's context or the maestro's judgment — those are
  the claude lane (see `routing.md`, Complex vs Critical).

## Cost

Covered by the user's ChatGPT subscription (or OpenAI API key). Cheaper than
the orchestrator; more expensive than budget API models.

Model choice here is a capability/speed knob, not a cost knob — the
subscription makes per-task cost flat. That's why the medium lane accepts the
default model while the complex lane requires an explicit one: same price,
different capability. Caveat: if the user runs codex on an API key instead of
a subscription, cost is no longer flat — treat every lane's model like
opencode's (explicit in the routing row) and remember high reasoning
multiplies token spend.

## Availability check

```bash
command -v codex
codex login status
```
