---
name: batuta-route
description: View or edit the project's routing table — lanes, executors, models, research lane, adapters. Use for /batuta-route or "which executor handles what". Not for onboarding (batuta-init).
disable-model-invocation: true
---

# Batuta route

## View

1. Show the table in effect: `.batuta/routing.md`, else `../batuta/references/routing.md` (say which).
2. For each executor the table names, run its adapter's `available` line and mark ✅ available / ⚠️ not found. Never check adapters the table does not name.
3. Report the stamp state (line 3 vs `profile.md`).

## Edit

1. No project copy yet → copy the default there first; never edit the skill's own file.
2. Apply the change keeping the markdown table: swap a row's executor or model, add a domain-specific row, add or remove the research row.
3. A model change on a multi-model CLI → discover with the adapter's `models` line and confirm the exact ID; never write one from memory.
4. A new executor without an adapter → copy `../batuta/adapters/_template.md` to `.batuta/adapters/<name>.md`, fill the frontmatter with the user, then add the row.
5. Refresh the stamp. Show the resulting table for confirmation.

*Done when:* the table shown is the file on disk and every row's executor was checked.
