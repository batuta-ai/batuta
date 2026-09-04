# Worktrees and parallelism

Read when the profile's Worktree line triggers, or when a batch runs in
parallel.

## Contents

- Mode
- Create
- Verify inside
- Integrate
- Parallel batches
- Cleanup

## Mode

Profile line `Worktree: off | medium+ | always`; no line = `off`.

| Mode | Where the executor works |
|---|---|
| `off` | main checkout |
| `medium+` | worktree for `medium` and above; `low` stays on the main checkout (a worktree for a rename is ceremony) |
| `always` | worktree for every lane |

The user may override per request.

## Create

1. Ensure `.batuta/worktrees/` is in `.git/info/exclude`.
2. `git worktree add .batuta/worktrees/<slug> -b batuta/<slug>` from the default branch.
3. Optional profile `Install: <command>` runs inside the worktree when tests need dependencies.
4. Invoke the executor with the worktree as its working directory (adapter `cwd` placeholder). The brief's first line names it: *work only inside `<path>`*.

The executor may commit freely there (WIP). Its history never reaches main.

## Verify inside

- Scope check: `git diff --name-only main...batuta/<slug>`.
- Diff review: `git diff main...batuta/<slug>`.
- Tests run inside the worktree. Environment failure (missing dependencies, not a red test) → run the profile's Install command and retry once. No Install line → say so out loud, apply the diff on the main checkout, run there, revert the applied diff before integrating. Never silently.
- Retry: same worktree. Escalation: `git reset --hard main` inside the worktree, then the next executor takes over.

## Integrate

Approved → squash onto the main checkout with your message:

```bash
git merge --squash batuta/<slug>
git commit -m "<message per the profile's methodology>"
git worktree remove .batuta/worktrees/<slug>
git branch -D batuta/<slug>
```

One verified task stays one atomic commit. Rejected work is a removed
worktree, not a revert on the user's checkout.

## Parallel batches

When the profile says `Execution: parallel` or the user asks:

- Independent items run at once, at most **four**, each in its own worktree regardless of the Worktree mode.
- Dependents wait for their dependency's commit, then start from the updated main.
- Verification and commit stay per item, in the order executors return. Integration is sequential: one squash at a time, tests re-run on main after each when two items touched the same files.
- A conflict at squash time → the item is re-briefed with the current main as context and runs again in a fresh worktree. Never resolve a conflict by guessing.
- Scouts never share a worktree with a code executor.

## Cleanup

An aborted item: `git worktree remove --force .batuta/worktrees/<slug>`
and `git branch -D batuta/<slug>`. `/batuta-status` lists leftover
worktrees; `/batuta-pause` records the ones still running.
