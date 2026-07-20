---
name: batuta-route
description: Batuta routing. Use when the user invokes /batuta:route or wants to view or edit the complexity-to-executor routing table.
---

# Batuta — routing

## View

1. Show the table in effect: the project's `.batuta/routing.md` if it exists,
   otherwise the plugin's `routing.md` (say which one applies).
2. For each executor, check availability as described in its adapter
   (`adapters/<executor>.md`) and flag it: ✅ available / ⚠️ not found.

## Edit

1. If the project has no `.batuta/routing.md` yet, copy the plugin default there
   before editing — never edit the plugin's own file.
2. Apply the requested change (swap a row's executor, add a row, point to a new
   adapter) keeping the plain markdown table format.
3. New executor without a matching adapter in `adapters/` → guide the user to
   copy `adapters/_template.md`, fill it in and save it as
   `adapters/<name>.md` (in the project, `.batuta/adapters/<name>.md` also works
   and takes precedence).
4. Show the resulting table for confirmation.
