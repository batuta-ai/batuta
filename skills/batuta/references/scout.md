# The scout — research for cents

Read when Step 2 needs discovery, when `/batuta-init` sweeps the project
map, or when the user asks where something lives. Research is delegated to
the research support lane (`routing.md`): a cheap model, read-only, in the
background. Only its distillate enters your context.

## Contents

- Research brief
- Report contract
- Scoped-write contract
- Verification
- Fan-out and fallback

## Research brief

Always contains:

1. The question(s), objective and answerable.
2. Starting points from the profile's Project map.
3. Boundaries: ignore `node_modules`, build output, generated files.
4. The report contract and the scoped-write contract below, verbatim — small models follow literal formats.
5. The output path: `.batuta/scout/<date>-<slug>.md`.

Invoke through the adapter's `readonly` line.

## Report contract

Four fixed sections, in this order:

```markdown
## Answer
Short prose answering the question.

## Files
path:line — why it matters (one per line)

## Evidence
Minimal snippets backing the answer.

## Uncertain
What was not found or stayed ambiguous. Mandatory — the honest escape hatch.
```

## Scoped-write contract

Pasted into every research brief:

> You may write exactly one file, at `<output path>`, and nothing else. Do
> not create, edit or delete any other file. Do not run commands that change
> state: no `git` writes, no package managers, no `mv`, `rm`, `>`, `>>`.
> Reading, `ls`, `grep`, `find`, `cat`, `head` are allowed. If the question
> or the output path is missing or ambiguous, write nothing and reply with
> the clarification you need. Your final reply is the one line
> `Wrote <output path>`.

## Verification

Before consuming a report:

1. **Guard** — `git status --porcelain` captured before dispatch, compared after. Any new or changed entry besides the report file means the scout wrote: revert those entries, count the run as failed.
2. **Structure** — the file exists with the four sections; every cited path exists (`ls`); every cited symbol greps in the file it is attributed to.

Ghost anchor → one retry carrying the specific feedback ("path X does not
exist"). Failed again → research it yourself. That is the lane's only
fallback; nothing escalates.

Semantic claims with valid anchors are accepted — Step 4 catches them
indirectly.

## Fan-out and fallback

- Independent questions → parallel scouts through the runtime's background facility; keep conducting, collect as they land. A short ad-hoc question may run in the foreground.
- The guard is only attributable when nothing else writes to the tree during the window: never run scouts in parallel with code executors on one checkout. For scout fan-out, give each its own worktree or accept that a dirtied tree fails the whole batch.
- Scouts never run inside a code executor's worktree.
- The adapter's native read-only mode is defense in depth. The guard is the guarantee.
