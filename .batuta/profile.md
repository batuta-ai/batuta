# Profile — batuta (host package)

Written by /batuta-init on 2026-09-06. Complements README.md and docs/; never repeats them.

Stack: Node 22 (CLI installer `bin/install.js`, no dependencies, no build; plugin manifests for Claude Code, Codex, Cursor, opencode; vendored skills)
Methodology: TDD; conventional commits; feature branches with a PR to main (release-please)
Test: bash tests/check.sh && node --test tests/*.test.js
Build:
Install:
Execution: sequential
Worktree: always
Template: templates/generic.md

## Conventions

- `fix:` and `feat:` commits release; `chore:` never does. Vendoring the skills is `fix(skills): vendor batuta-ai/skills vX` through `scripts/sync-skills.sh`; never edit `skills/` by hand.
- `bin/install.js` is one file, CommonJS, standard library only; every step prints the command it runs; failures name the host and the fix; `--only <host>`, `--dry-run`, `--list` are the flags.
- Tests in `tests/install.test.js` use `node:test` with injected dependencies (no real network, no real `claude`/`codex` calls); `tests/check.sh` lints manifests and the vendored skills.
- `CORE_VERSION` in `bin/install.js` pins the core release; the archive is checked against the release's `checksums.txt`.
- README.md keeps a PT-BR mirror in README.pt-BR.md; everything else is English.

## Project map

Swept by the research lane (agy / gemini-3.8-flash-low) on 2026-09-06; report in `.batuta/scout/2026-09-06-project-map.md`.

One Node file does the work; the rest is manifests and vendored content.

- `bin/install.js` — the installer, CommonJS, no dependencies. `HOSTS` (line ~43) is the table of hosts (claude, codex, cursor, opencode, agy) with their install commands, detection and `after` hooks; `installSharedSkills` (~109) copies `skills/` into `~/.agents/skills` with staging and rollback; `expectedChecksum` (~240) and `downloadCore` (~251) fetch the goreleaser archive pinned by `CORE_VERSION` and verify it against `checksums.txt`; `main` (~350) parses the flags (`--dry-run`, `--list`, `--only <host>`, `--all`, `--no-core`) and runs the hosts. An unknown flag is ignored and the install runs (issue #57).
- `tests/install.test.js` — `node:test`, dependency injection: `main(argv, deps)`, `downloadCore(deps)`, `installSharedSkills(dryRun, paths)`, `pruneSkillLinks`, `shadowSharedSkillsInCodex`; helpers `host(id, steps, after)`, `quiet`, `quietAsync`, `fakeFetch`. No network, no real CLIs.
- `tests/check.sh` — manifests are valid JSON, `skills/` hash matches `skills-lock.json`, command files route to existing skills, plugin versions agree across `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, no retired references, then the node tests.
- `commands/` — the `/batuta:*` slash commands (init, loop, pause, plan, resume, review, route, status) for Claude Code and Codex; `hosts/opencode/commands/` the opencode wrappers; `hooks/hooks.json` + `scripts/session-start.sh` the SessionStart hook.
- `skills/` — vendored from batuta-ai/skills at the ref in `skills-lock.json`; never edited here (`scripts/sync-skills.sh <tag>` rewrites it).
- Manifests: `.claude-plugin/{plugin,marketplace}.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/{plugin,marketplace}.json`, `.agents/plugins/marketplace.json`, `package.json`; versions bumped by release-please.
- Do not touch: `CHANGELOG.md`, `.release-please-manifest.json`, `release-please-config.json`, `skills-lock.json`, `skills/`, `.github/`.
- `docs/` — specs and history, plus brand assets.
