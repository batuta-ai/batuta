# Stack template: Python

Conventions injected into briefs for Python projects (APIs, scripts, libs).
Extends `templates/generic.md`.

## Conventions for briefs

- Dependencies through the project's manager only (uv, poetry, pip +
  requirements) — never install outside it.
- Type hints on public function signatures when the project uses them; follow
  the project's strictness (mypy/pyright config).
- Follow the existing module/package layout; imports absolute or relative per
  the project's pattern.
- Errors: raise specific exceptions; follow the project's own exception
  hierarchy where one exists.
- Tests: the project's runner (pytest, unittest…) in the project's style —
  reuse existing fixtures and `conftest.py` before writing new setup.

Never:

- Bare or silent `except` (including `except Exception: pass`).
- Mutable default arguments.
- Imports with side effects (work at import time).
- SQL built by string interpolation or f-strings — always parameterized.

## Verification hints for the orchestrator

- Flag: `print` where the project uses logging, missing type hints in a typed
  codebase, tests that touch real services, new dependencies not requested by
  the brief.
