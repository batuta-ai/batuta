# Compozy runtime — managed sessions for the cycle's delegations

How the maestro dispatches executors through
[CompozyOS](https://www.compozy.com) when it is present. Dormant like the
adapters: skills point here in one line; read this file only when the
runtime is active. The cycle itself never changes — Compozy swaps how the
executor runs and where the report comes from, nothing else.

## Activation and precedence

Two triggers, checked in order:

1. **Managed maestro — automatic.** `COMPOZY_SESSION_ID` present in the
   environment means this session is Compozy-managed; every delegation
   goes through Compozy (child sessions), regardless of the profile. The
   user chose the runtime by launching Batuta through it — subprocess
   delegation from inside would hide the instrumentists from the daemon.
2. **Profile opt-in.** `Runtime: compozy` in `.batuta/profile.md`
   (offered by `/batuta:init` when the daemon is detected; no line =
   `direto`).

Neither trigger → subprocess per the adapter, as always. Daemon down or a
dispatch refused by policy → fall back to subprocess **with a loud
warning**, never silently; the cycle must not fail for Compozy's absence.

When active, this file's delegation row takes precedence over the codex
plugin's transport row (Step 3): a codex-lane delegation runs as a
Compozy session with `--provider codex`. The plugin's other roles
(prompting method, `codex:rescue`, cross-review) are unaffected.

## Map — cycle moment → runtime behavior → what Batuta keeps

| Cycle moment | Runtime behavior | What Batuta keeps |
| --- | --- | --- |
| Delegation (Step 3) | executor runs as a managed session, native provider | routing row's executor+model+reasoning; the brief; worktree placement |
| Parallel batch (Step 1.5/3) | one session per item, waves of ≤ 5 | decomposition, per-item verify/commit |
| Result collection (Step 3→4) | report read from the session transcript | report ≠ evidence (`verification.md`); the trail records the session id |
| Status (`/batuta:status`) | daemon sessions listed alongside background tasks | `WORK.md` as the source of truth |
| Pause/resume | session ids in the handoff; sessions survive the terminal | the handoff contract of `/batuta:pause` |

## Delegation row

Name every session `batuta/<slug>` — status and resume find them by name.

**Maestro outside the daemon** (profile trigger): one call carries
everything —

    compozy session new \
      --cwd "<task dir — the worktree when Worktree mode places one>" \
      --provider <routing row executor> --model <row model> \
      --reasoning-effort <row effort, when the row names one> \
      --name "batuta/<slug>" \
      --prompt "<the brief, verbatim>" -o json

**Managed maestro** (`COMPOZY_SESSION_ID` set): spawn a child, then send
the brief —

    compozy spawn --agent <agent> --provider <executor> --model <model> \
      --name "batuta/<slug>" --ttl-seconds <TTL> \
      --workspace-path "<task dir>" -o json
    compozy session prompt <child id> "<the brief, verbatim>"

`--ttl-seconds` is mandatory on spawn: default to 3600 for a single task;
scale up for a long batch, never unbounded. Child permissions are ⊆ the
parent's — if the workspace policy blocks the executor CLI, the dispatch
fails; that is a setup problem to surface, not to work around.

**Wait and collect:** `compozy session wait <id>`, then read the
executor's report from `compozy session history <id> -o json` (confirm
the exact JSON shape on first use; `compozy session recap <id>` is the
fallback summary). The report feeds Step 4 exactly like subprocess
output: it is never evidence. The run trail (`runs.md`) records the
session id as the replay reference.

## Parallelism row

Each batch item gets its own session (child sessions when managed). The
spawn default caps children at 5 per parent — run larger batches in
waves of ≤ 5 and say so. Sessions survive the terminal: `/batuta:pause`
records the ids in the handoff; `/batuta:resume` reattaches
(`compozy session status <id>`, `wait`, or `resume`).

## Status row

`/batuta:status` also lists the project's `batuta/*` sessions
(`compozy session list -o json`, filtered by name) with their state,
alongside background tasks and worktrees. `WORK.md` remains the source
of truth; the daemon is a lens.

## Setup prerequisites (init)

- `compozy` on PATH and the daemon responding (`compozy session list`
  answers) before offering the profile line.
- The workspace policy must allow the executor CLIs the routing table
  names; when a dispatch is refused, tell the user which policy blocked
  it instead of degrading silently.
