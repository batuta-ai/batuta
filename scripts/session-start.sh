#!/usr/bin/env bash
# SessionStart hook: one short line of resident context, no more.
# Read-only. Prints the Batuta pointer and, when the core binary and a
# profile exist, a one-line doctor summary.
set -u
if [ -f .batuta/profile.md ]; then
  echo "Batuta is set up here: delegable code tasks go through the batuta skill (/batuta:status, /batuta:route, /batuta:plan, /batuta:loop, /batuta:pause, /batuta:resume)."
else
  echo "Batuta installed, project not set up: run /batuta:init once, then ask for a code task."
fi
if command -v batuta >/dev/null 2>&1 && batuta version >/dev/null 2>&1 && [ -f .batuta/profile.md ]; then
  # The hook has 15 s; doctor probes every executor. Cap it well below.
  batuta doctor --json --timeout 5s 2>/dev/null | python3 -c '
import json,sys
try:
    r=json.load(sys.stdin)
except Exception:
    sys.exit(0)
up=[e["executor_id"] for e in r.get("executors",[]) if e.get("availability")=="available"]
print("executors available: " + (", ".join(up) or "none"))' 2>/dev/null
fi
exit 0
