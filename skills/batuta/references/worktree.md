# Worktrees and parallelism

Read when the profile's Worktree line triggers, or when a batch runs in
parallel.

## Contents

- Mode
- Home
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
| `medium+` | worktree for `medium` and above; `low` stays on the main checkout |
| `always` | worktree for every lane |

The user may override per request.

## Home

Profile `Worktree-home: repository | cache` defaults to `repository`.
Repository home: `<root>/.batuta/worktrees`. Cache home:
`<os.UserCacheDir()>/batuta/worktrees/<digest>`, with `<digest>` = first 16
hex SHA-256 characters of the canonical repository root path. OS cache: `~/Library/Caches`
(macOS), `$XDG_CACHE_HOME` or `~/.cache` (Linux), `%LocalAppData%` (Windows).
Record absolute `<worktree-path>` and `<base>`; use them even if the profile
changes. Never move an existing tree.

## Create

1. Select the home. For repository home, exclude `.batuta/worktrees/` in `.git/info/exclude`.
2. Record `<base>` from the user's checkout (`git rev-parse --abbrev-ref HEAD`), never assume `main`.
3. Set and record `<worktree-path>` to the actual absolute `<home>/<slug>`; `git worktree add <worktree-path> -b batuta/<slug> <base>`.
4. Run profile `Install: <command>` there if tests need dependencies.
5. Invoke the executor there (adapter `cwd`); start its brief with *work only inside `<worktree-path>`*.

The executor may commit WIP there; that history never reaches `<base>`.

## Verify inside

- **Snapshot first.** After execution, inside the worktree: non-empty `git status --porcelain` → `git add -A && git commit -q -m "wip(batuta): <slug> candidate"`. Verification, review and squash use one complete tree; no uncommitted work is approved or lost.
- Check scope with `git diff --name-only <base>...batuta/<slug>`; review `git diff <base>...batuta/<slug>`.
- Test there. Missing dependencies (not a red test) → run profile Install and retry once. With no Install line, say so, apply the diff on the user's checkout, test there, then revert that diff before integrating. Never silently.
- Retry in the same tree; snapshot before re-verifying. For escalation, `git reset --hard <base>` there before the next executor takes over.

## Integrate

Approved → squash onto the user's checkout on `<base>`:

```bash
git merge --squash batuta/<slug>
git commit -m "<message per the profile's methodology>"
git worktree remove <worktree-path>
git branch -D batuta/<slug>
```

One verified task is one atomic commit. Rejected work is a removed worktree,
not a revert on the user's checkout. If `<base>` moved, the squash may
conflict; see Parallel batches.

## Parallel batches

When profile says `Execution: parallel` or the user asks:

- Run at most **four** independent items at once, each in its own worktree regardless of Worktree mode.
- Start dependents after their dependency commits, from updated `<base>`.
- Verify and commit per item as executors return. Integrate sequentially; re-run tests on `<base>` after each if two items touched the same files.
- A squash conflict → re-brief with current `<base>` and run in a fresh worktree; never guess a resolution.
- Scouts never share a worktree with a code executor.

## Cleanup

Abort: `git worktree remove --force <worktree-path>` then
`git branch -D batuta/<slug>`. `/batuta-status` lists leftovers;
`/batuta-pause` records those still running.
