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

Neither trigger → subprocess per the adapter, as always. Daemon down → fall
back to subprocess **with a loud warning**, never silently; the cycle must
not fail for Compozy's absence. A dispatch refused by policy → surface
which policy blocked it, then fall back to subprocess per the adapter,
loudly — never silently swallowed.

**The scout stays on subprocess.** Research dispatches read-only per the
adapter's contract and run for seconds — the runtime adds nothing there,
so scouts never become sessions, managed or not.

When active, this file's delegation row takes precedence over the codex
plugin's transport row (Step 3): a codex-lane delegation runs as a
Compozy session with `--provider codex`. The plugin's other roles
(prompting method, `codex:rescue`, cross-review) are unaffected.

**Not a delegation:** the `claude.md` adapter's self-execution (critical
lane — the maestro executes itself because it needs conversation
context) never becomes a session; it stays in the maestro's own session
regardless of the runtime. Only claude *background instances* — a
Complex-row `claude -p` — become managed sessions like any other
delegation; the scout never does, per the scout rule above.

## Map — cycle moment → runtime behavior → what Batuta keeps

| Cycle moment | Runtime behavior | What Batuta keeps |
| --- | --- | --- |
| Delegation (Step 3) | executor runs as a managed session, native provider | routing row's executor+model+reasoning; the brief; worktree placement |
| Plan & lifecycle (Steps 1–5) | items mirrored as tasks, delegations as task runs (Task board row) | `WORK.md` as the only source of truth; `complete` only after verification |
| Parallel batch (Step 1.5/3) | one session per item, waves of ≤ 5 | decomposition, per-item verify/commit |
| Result collection (Step 3→4) | report read from the session transcript | report ≠ evidence (`verification.md`); the trail records the session id |
| Status (`/batuta:status`) | daemon sessions listed alongside background tasks | `WORK.md` as the source of truth |
| Pause/resume | session ids in the handoff; sessions survive the terminal | the handoff contract of `/batuta:pause` |

## Delegation row

Name every session `batuta/<slug>` — status and resume find them by name.

**Maestro outside the daemon** (profile trigger): create, then prompt —
since CLI 0.3.0 the provider/model/reasoning overrides live on the
prompt, not on session creation —

    compozy session new \
      --cwd "<task dir — the worktree when Worktree mode places one>" \
      --name "batuta/<slug>" -o json
    compozy session prompt <session id> "<the brief, verbatim>" \
      --provider <routing row executor> --model <row model> \
      --reasoning-effort <row effort, when the row names one>

**Managed maestro** (`COMPOZY_SESSION_ID` set): spawn a child, then send
the brief —

    compozy spawn --agent <agent> --provider <executor> --model <model> \
      --name "batuta/<slug>" --ttl-seconds <TTL> \
      --workspace-path "<task dir>" -o json
    compozy session prompt <child id> "<the brief, verbatim>"

`--workspace-path` is a permission grant, not a working directory —
`spawn` has no cwd flag (only `session new` takes `--cwd`). Worktree
placement stays explicit: the brief's first line already names the
working directory (`work only inside <task dir>`), which covers the
common case. When precise placement matters (Worktree mode active) and
the child path isn't reliable enough, prefer running `compozy session
new --cwd "<task dir>" ...` from inside the managed session instead of
`spawn` — a direct session sets cwd exactly but drops out of the
parent/child bookkeeping that `spawn` gives you; pick child `spawn` for
routine delegation, direct `session new` when the worktree path must be
exact.

`--ttl-seconds` is mandatory on spawn: default to 3600 for a single task;
scale up for a long batch, never unbounded. Child permissions are ⊆ the
parent's — if the workspace policy blocks the executor CLI, surface
which policy blocked it, then fall back to subprocess per the adapter,
loudly.

**Agent:** omit `--agent` (or `session new`'s equivalent) unless the
workspace configures one — the daemon's default agent (`general`) covers
routine delegation.

**Lane → provider mapping:** executor `codex` → `--provider codex
--model <row model>`; executor `opencode` → `--provider opencode
--model <row's provider/model id>`; a claude background instance →
`--provider claude --model <row model>`; an executor outside Compozy's
provider catalog → wrapped transport, where the session receives the
adapter's non-interactive command as its task instead of a native
provider call.

**Wait and collect:** `compozy session wait <id>`, then read the
executor's report from `compozy session history <id> -o json` (confirm
the exact JSON shape on first use; `compozy session recap <id>` is the
fallback summary). The report feeds Step 4 exactly like subprocess
output: it is never evidence. The run trail (`runs.md`) records the
session id as the replay reference.

## Retry, escalation and cleanup

- **Retry (Step 4)** goes to the *same* session — `compozy session
  prompt <id> "<feedback>"` — preserving the executor's context instead
  of starting cold.
- **Escalation** stops the old session (`compozy session stop <id>`)
  and creates a new one per the new routing row, name suffixed
  (`batuta/<slug>#2`).
- **Commit or definitive abort (Step 5)** stops the session — mirroring
  worktree removal. Sessions are never left running after their task
  ends.

## Parallelism row

Each batch item gets its own session (child sessions when managed). The
spawn default caps children at 5 per parent — this throttles the
managed path only (`compozy spawn`); it does not apply to the
profile-trigger path (`compozy session new`, no parent). On the managed
path, run larger batches in waves of ≤ 5 and say so. Sessions survive
the terminal: `/batuta:pause`
records the ids in the handoff; `/batuta:resume` reattaches
(`compozy session status <id>`, `wait`, or `resume`).

## Task board row

With the runtime active, the plan itself becomes visible on the daemon's
task board (`compozy open`): each `WORK.md` work item is mirrored as a
Compozy task and each delegation runs as a task run. The maestro drives
every transition — the executor never touches the board, and `complete`
happens only after Step 4's verification approves, so the board shows
*verified* state, never self-reported state.

**Mirror (Step 1/1.5):** when an item enters `WORK.md` —

    compozy task create --scope workspace \
      --identifier "batuta/<slug>" --title "<item title>" \
      --metadata '{"lane":"<lane>","executor":"<executor>"}' -o json

Same slug as the session name — task and session find each other by it.
Plan ordering maps to `compozy task dependency add`; parallel batch
items become child tasks of the batch item (`compozy task child create`).

**Run lifecycle (Step 3→5):** the maestro uses the operator-level run
commands — session-bound claiming (`task next`, `heartbeat`) requires a
managed identity and would bind the lease to the *maestro's* session,
the wrong actor; the operator path works identically inside and outside
the daemon:

    compozy task run enqueue <task-id> -o json        # at dispatch
    compozy task run attach-session <run-id> --session "<session id>"
    compozy task run start <run-id>
    # after Step 4 approves:
    compozy task run complete <run-id> --result '{"verdict":"approved","commit":"<sha>"}'
    # retry exhausted / definitive failure:
    compozy task fail <run-id> --reason "<what failed>"
    compozy task retry <run-id>                       # new attempt, same task

Retries within the same session keep the same run alive — nothing to do
on the board. Escalation swaps the session (delegation row), never the
task: fail the run, `task retry`, attach the new session — attempt
history stays aggregated per work item.

**Blockers:** `compozy task block <task-id> --kind
<needs_input|capability|transient> --reason "<reason>"` when an item
blocks; `compozy task unblock <task-id>` when it clears.

**Definitive abort:** when an item is abandoned for good (trail verdict
`❌ aborted`), fail its run and cancel the task —
`compozy task cancel <task-id>` — so the board does not keep a live item
the plan has dropped.

**Rules:**

- **One-way sync** (`WORK.md` → board): `/batuta:resume` reconciles by
  creating whatever is missing on the board; board state never flows
  back into `WORK.md`. Divergence resolves in `WORK.md`'s favor — the
  board is a lens, not memory.
- **The scout never becomes a task** — same rule as sessions: research
  dispatches are not work items.
- **Best-effort, always:** daemon down or a task command refused → warn
  loudly and continue the cycle on `WORK.md` alone. The cycle never
  waits on, or fails for, the board.
- **The trail records the task id** next to the session id (`runs.md`).
- Confirm the exact JSON shape of `task create`/`task run enqueue` — and
  the operator path's behavior end to end — on first use, as with
  `session history`.

## Status row

`/batuta:status` also lists the project's `batuta/*` sessions
(`compozy session list --query batuta/ -o json`, add `--all` to include
stopped sessions) with their state,
alongside background tasks and worktrees. With the task board in use, also list the project's `batuta/*` tasks
(`compozy task list --query batuta/ -o json`); `compozy open` shows the
same items as a kanban. `WORK.md` remains the source
of truth; the daemon is a lens.

## Setup prerequisites (init)

- `compozy` on PATH and the daemon responding (`compozy session list`
  answers) before offering the profile line.
- The workspace policy must allow the executor CLIs the routing table
  names; when a dispatch is refused, tell the user which policy blocked
  it instead of degrading silently.
- The `AGENTS.md` discovery pointer (init first-run step 3.5) is what makes
  daemon-born maestro sessions aware of Batuta by default — recommend it
  whenever the profile says `Runtime: compozy`.
