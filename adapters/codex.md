# Adapter: codex

OpenAI's Codex CLI running non-interactively. Default executor for medium tasks.

## Invocation

```bash
codex exec --sandbox workspace-write "<brief>"
```

- Run from the project root; `workspace-write` lets it edit files but not leave
  the workspace.
- Add `--cd <path>` to target another directory instead of cd-ing.
- For riskier tasks, downgrade to `--sandbox read-only` and apply the proposed
  diff manually.

## Context passing

Brief goes inline as the argument. For long briefs (> ~100 lines), write the
brief to a file and reference it:

```bash
batuta_brief=$(mktemp) && cat > "$batuta_brief" <<'EOF'
<brief>
EOF
codex exec --sandbox workspace-write "Follow the instructions in $batuta_brief"
```

## Capabilities and limits

- Good at: isolated features, bugfixes with a clear repro, tests, refactors
  scoped to a few files.
- Avoid delegating: architecture decisions, security-sensitive changes,
  multi-file refactors without a precise file list in the brief.

## Cost

Covered by the user's ChatGPT subscription (or OpenAI API key). Cheaper than
the orchestrator; more expensive than budget API models.

## Availability check

```bash
command -v codex
codex login status
```
