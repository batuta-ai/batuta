# Loop orphan worktrees

Read for leftover loop task worktrees or before cleanup. Core's `batuta loop
--prune` needs v1.1.0-beta.54 or later; worktree process cleanup needs
v1.1.0-beta.56 or later. Check the installed core before relying on either.

## Report and ownership

`batuta loop --prune [--workspace <dir>]` is a read-only report of unowned
generated loop task worktrees. `--prune` takes no plan argument and no other
loop flags besides optional `--workspace`. Run it alone, not as an add-on to
`--resume`, `--abandon`, `--roadmap`, `--keep-worktrees`, or a plan path.

Core checks registered worktrees in both repository and user cache homes. It
manages only a matching directory `<slug>-task-<N>-e<K>` and generated branch
`batuta/<slug>/task-<N>-e<K>` pair; the main worktree, detached trees and
interactive `batuta/<slug>` branches are outside prune ownership. Clean up an
interactive branch and its recorded worktree path explicitly per
`../../batuta/references/worktree.md`.

A delivery is open unless its journal ends in `done` or `abandoned`. That
includes missing terminal records and `waiting_input`, `waiting_plan`,
`blocked`, and `canceled`. An open delivery owns the matching branch and
recorded `worktree_root` in its journal. A managed tree without that owner is
an `orphan`; a missing directory or prunable git registration is `missing`.
Changing `Worktree-home:` does not change a journaled path or make an open
delivery's worktree eligible.

The report prints TSV `path`, `branch`, `slug`, `state` (`orphan` or `missing`).
With a live runner it warns on stderr but still reports and exits 0. Process
rows, when present, give `process`, path, PID, command, and signal (`-` in a
read-only report). Read the paths and process rows before deciding to clean.

## Conditional cleanup

Only after identifying an eligible orphan, preserving needed ignored files,
and deciding to remove it, run `batuta loop --prune --apply [--workspace <dir>]`.
`--apply` takes no plan argument and no other loop flags besides optional
`--workspace`. Never run `--apply` as part of read-only `/batuta-status`.
It refuses and removes nothing while any delivery in the workspace has a live
runner. Before each removal it re-checks journals and git registration; an
entry claimed meanwhile is `skipped` and the command exits 2 if any entry is
skipped. A short race remains after this check.

For an `orphan`, core parks tracked, staged, unstaged and untracked files at
`refs/batuta/parked/<slug>/task-<N>-e<K>`, then removes the directory and
branch (`removed`). Git-ignored files are excluded from the park and deleted
with the tree: copy a needed `.env` elsewhere before applying. For `missing`,
there is no snapshot; core retains the branch and its commits, prunes the
stale git registration, and reports `missing`. Exit 0 means all entries were
`removed` or `missing`; exit 2 means at least one was `skipped`.

## Process effects

Before removing a loop worktree during integration, abort, replacement or
prune apply, core stops visible processes whose resolved working directory
is at or below it, including background dev servers, editors and terminals.
Open files and command arguments do not count; the caller and its ancestors
are exempt. Core sends SIGTERM, waits 3 seconds, then SIGKILL if needed.
`--prune` without `--apply` lists processes without stopping them.

Linux and macOS support scanning and stopping; Windows warns and removes the
tree without stopping processes. A failed or partial scan warns and removal
continues, so an unseen process may survive. Core checks process identity
before signaling; PID reuse can still leave a narrow risk on macOS and older
Linux kernels. A process that does not stop or whose identity changes is
warned about, not counted as stopped.
