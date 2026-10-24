# Tool ignores for `.batuta/`

Read at `/batuta-init` first-run step 12 and reconfigure step 2.

`.batuta/` holds run trails, review snapshots, journals and, with
`Worktree-home: repository`, whole copies of the project under
`.batuta/worktrees/`. Git keeps those out through `.git/info/exclude`, but
most JavaScript tools never read that file: they walk every directory that is
not on their own ignore list, then pick up a second copy of the tests, a
second `package.json` or a half-written review file and fail the project's
gate. `Worktree-home: cache` moves the worktrees out; the rest of
`.batuta/` stays, so the ignores below are needed with either home.

## Detect

Look only at configs whose root is the repository root, or any directory
that contains `.batuta/`. A package config inside a monorepo workspace
does not walk the root and needs nothing.

## Edit per tool

| Tool | Where | Edit |
|---|---|---|
| Vitest | `test.exclude` in `vitest.config.*` or `vite.config.*` | `exclude: [...configDefaults.exclude, '**/.batuta/**']`, importing `configDefaults` from `vitest/config`. A bare list replaces the defaults and starts scanning `node_modules`. |
| Jest | `jest.config.*` or the `jest` key of `package.json` | add `'<rootDir>/.batuta/'` to `testPathIgnorePatterns` and to `modulePathIgnorePatterns`. Keep `'/node_modules/'` in the first: setting the key replaces its default. The second stops the "Haste module naming collision" a worktree's `package.json` causes. |
| ESLint, flat config | `eslint.config.*` | add `{ ignores: ['.batuta/**'] }` as its own array element. `ignores` is global only in an object with no other key. |
| ESLint, legacy | `.eslintrc*` | add `.batuta/` to `.eslintignore`. |
| TypeScript | `tsconfig.json` | nothing by default: the `*` and `**` wildcards of `include` skip directories whose name starts with a dot. Edit only when `include` or `files` names `.batuta` itself, as `.batuta/...` or `**/.batuta`. In `files`, remove it: `exclude` does not apply to `files`. In `include`, remove it or add `".batuta"` to `exclude`; when `exclude` is new, also write `"node_modules"`, since an explicit list drops the default. The file is JSONC: edit the text, keep its comments. |
| Prettier | `.prettierignore` | add `.batuta/`. |
| Biome | `biome.json` or `biome.jsonc` | v2: add `"!**/.batuta"` to `files.includes` after the positive patterns, since the last pattern that matches decides. No `files.includes` → write `"files": { "includes": ["**", "!**/.batuta"] }`. v1: add `".batuta"` to `files.ignore`. Write `.batuta` as a whole path segment; `batuta doctor` does not read partial globs such as `.bat*`. The major version comes from the `$schema` URL, else from `@biomejs/biome` in `package.json`. |
| Playwright | `playwright.config.*` | nothing when `testDir` is set. Otherwise add `'**/.batuta/**'` to `testIgnore`. |
| pytest | `pytest.ini`, `pyproject.toml`, `setup.cfg` | nothing by default: `norecursedirs` skips `.*`. A project that sets `norecursedirs` must keep `.*` or add `.batuta`. |

A tool not in this table: read its documentation for an ignore list
before writing anything. Not found → it goes on the warning list.

## Apply

1. Show every proposed edit as a short diff in one message; the user accepts
   or declines each one.
2. Apply the accepted edits as text. Never reformat a config or reorder its
   keys.
3. A config built by a function, imported from a shared package or spread
   from a preset you cannot see is not edited. Warn instead: name the file,
   the tool and the exact entry to add.
4. Applied edits are tracked user files. The loop preflight stops on a
   dirty tree outside `WORK.md` and `.batuta/`, so offer them in a commit of
   their own (`chore: ignore .batuta in <tools>`) before the setup commit.
   Declined commit → say the loop will refuse to start until they are
   committed or reverted.

## Report

One line per tool: patched, already ignored, not needed, or warned with
the entry to add. The report of `/batuta-init` carries these lines.
