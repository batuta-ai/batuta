# Dispatch — native, then external

## Selection

1. Freeze executor/model/effort/cost/isolation/permissions; overrides win.
   Never reroute/substitute for transport.
2. Native requires `Dispatch: auto` and current-runtime mapping of executor,
   exact model/effort, isolation and permissions. Unknown fails; CLIs prove
   nothing; headless core has no native child.
3. Prefer eligible native; else independent external `cli|acp|auto`, default
   CLI. Honor explicit user ACP.
4. Selected same-route CLI: check adapter `available`; absent → routing's
   unavailable-route policy. Never reroute to gain native/ACP.
5. ACP requires `dispatch`, core ≥`v1.1.0-beta.24` (semver, never lexical),
   and exact qualification.
6. Qualified core runs all modes, CLI included:
   `batuta dispatch --brief-file <abs> --executor <id> --model <id>
   [--effort <v>] --cwd <abs> --transport <mode> --timeout 45m`.
   Empty effort omitted. Missing/old core: explicit ACP stops/reports unavailable
   (no next row/install); default/auto runs checked same-route CLI.

Only OpenCode 1.18.31/`opencode acp`/darwin-arm64/
`opencode/big-pickle`/empty effort qualifies, never metadata. Do not alter
provider permissions or substitute models.

## Receipt

Classes/codes: completed/0, failed/1, unavailable/2, invalid_arguments/2,
waiting_input/3, rate_limited/4, uncertain/5; interrupt/timeout use 130/124.
Keep it ≤4 KiB: selected transport; requested/observed model and effort
(`unknown` when unseen); changed paths; claims/proof references; uncertainty;
owned overflow-log pointer. Missing usage stays unknown. Raw logs stay owned;
no summarizing LLM.
Worker output is an unverified claim: gate scope, tree/diff, tests and criteria;
the verifier is a separate CLI session. New callbacks deny.

After possible submission, any incomplete/uncertain outcome preserves artifacts
and worktree for reconciliation: never replay, switch transport, reuse the session
or inject protocol. `auto` fallback is only before submission and verified shutdown.
