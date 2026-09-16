# Dispatch — native eligibility

## Selection

1. Freeze route first: executor, requested model/effort, isolation, permissions;
   user model overrides win.
2. Absent `Dispatch:` is legacy CLI: check its adapter, then run it. `Dispatch: auto`
   opts an interactive conductor into native eligibility.
3. If auto-native is eligible, check and invoke only it; CLI absence is irrelevant.
4. Otherwise, before submission check same-route CLI; if absent, use existing
   unavailable-route policy. Never reroute for native access.
5. After native accepts submission, cancellation, partial or uncertain outcomes
   are non-success; never auto-replay through CLI.

## Native eligibility

- Host exposes a native subagent and controls; CLI installation proves nothing.
  Standalone/headless hosts use CLI.
- Facility maps executor and accepts requested model/effort. Missing, unknown or
  incompatible values fail; never inherit a model.
- Isolate the self-sufficient brief from full conversation. Retain criteria,
  conventions, scope, boundaries, proofs, permissions and stop conditions.
- Worktree isolation/controls exist; labels prove nothing.

No native adapter, daemon, install step or host-tool name.

## Receipt

Target ≤4 KiB: task/attempt identity, outcome, selected transport, requested and
observed model/effort (`unknown` if unobserved), changed paths, worker claims, evidence
references and uncertainty. Overflow names the owned full-evidence reference and
why selective reading is needed.

Worker claims are unverified; run scope, diff, test and criterion gates. Add no
summarizing LLM or arbitrary loop-journal entries.
