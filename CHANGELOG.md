# Changelog

## [0.4.5](https://github.com/batuta-ai/batuta/compare/v0.4.4...v0.4.5) (2026-09-06)


### Bug Fixes

* **install:** pin core v1.1.0-beta.9 (batuta loop); vendor batuta-ai/skills v0.5.5 ([#49](https://github.com/batuta-ai/batuta/issues/49)) ([011dffb](https://github.com/batuta-ai/batuta/commit/011dffbb01147dcea0df91dbf79e76daeb71203b))

## [0.4.4](https://github.com/batuta-ai/batuta/compare/v0.4.3...v0.4.4) (2026-09-06)


### Bug Fixes

* **install:** disable the shared skill copies in Codex when the plugin is installed ([#47](https://github.com/batuta-ai/batuta/issues/47)) ([4d77926](https://github.com/batuta-ai/batuta/commit/4d77926cfaae98e9d4e9ba6beaa7555380405dd5))

## [0.4.3](https://github.com/batuta-ai/batuta/compare/v0.4.2...v0.4.3) (2026-09-06)


### Bug Fixes

* **install:** remove duplicate skill links on plugin hosts; target one agent in the skills CLI hint ([#45](https://github.com/batuta-ai/batuta/issues/45)) ([7722a5a](https://github.com/batuta-ai/batuta/commit/7722a5aac6316c5735cded27d60ec81e0336f342))

## [0.4.2](https://github.com/batuta-ai/batuta/compare/v0.4.1...v0.4.2) (2026-09-06)


### Bug Fixes

* **skills:** vendor batuta-ai/skills v0.5.4 ([#43](https://github.com/batuta-ai/batuta/issues/43)) ([2aaa836](https://github.com/batuta-ai/batuta/commit/2aaa836a27ee6ec3193bdebb1eb1f45791628431))

## [0.4.1](https://github.com/batuta-ai/batuta/compare/v0.4.0...v0.4.1) (2026-09-06)


### Bug Fixes

* **install:** exclusive staging, regular-file member, GOBIN fallback; pin core v1.1.0-beta.7 ([#41](https://github.com/batuta-ai/batuta/issues/41)) ([f0f8fa6](https://github.com/batuta-ai/batuta/commit/f0f8fa63d5a8b3a4dc4603c6d09817e2f2df435a))

## [0.4.0](https://github.com/batuta-ai/batuta/compare/v0.3.4...v0.4.0) (2026-09-05)


### Features

* **install:** download the pinned core binary from GitHub Releases ([#37](https://github.com/batuta-ai/batuta/issues/37)) ([8ff86b3](https://github.com/batuta-ai/batuta/commit/8ff86b319975ce4f2d19d08406167171bf7e9dea))

## [0.3.4](https://github.com/batuta-ai/batuta/compare/v0.3.3...v0.3.4) (2026-09-05)


### Bug Fixes

* **skills:** release the vendored batuta-ai/skills v0.5.3 ([#34](https://github.com/batuta-ai/batuta/issues/34)) ([8442269](https://github.com/batuta-ai/batuta/commit/8442269cf4b30371873fb3ee3f6c71ace609a8b2))

## [0.3.3](https://github.com/batuta-ai/batuta/compare/v0.3.2...v0.3.3) (2026-09-05)


### Bug Fixes

* **install:** stage the shared skills, keep the previous copy on failure, retire dropped skills ([#30](https://github.com/batuta-ai/batuta/issues/30)) ([ab5efe4](https://github.com/batuta-ai/batuta/commit/ab5efe428cf47642429f4a48cad645db0fe4085a))

## [0.3.2](https://github.com/batuta-ai/batuta/compare/v0.3.1...v0.3.2) (2026-09-05)


### Bug Fixes

* **install:** copy the vendored skills into ~/.agents/skills for Cursor, opencode and Antigravity ([#27](https://github.com/batuta-ai/batuta/issues/27)) ([04b8b0f](https://github.com/batuta-ai/batuta/commit/04b8b0f924fe828b5ac7c663a63f574d5ad0c8f4)), closes [#26](https://github.com/batuta-ai/batuta/issues/26)

## [0.3.1](https://github.com/batuta-ai/batuta/compare/v0.3.0...v0.3.1) (2026-09-05)


### Bug Fixes

* **install:** correct the Codex command, propagate failures, cap the hook's doctor probe ([#24](https://github.com/batuta-ai/batuta/issues/24)) ([7bc4037](https://github.com/batuta-ai/batuta/commit/7bc4037edc31ac225c07577362a9d8681a0026f8))

## [0.3.0](https://github.com/batuta-ai/batuta/compare/v0.2.14...v0.3.0) (2026-09-05)


### ⚠ BREAKING CHANGES

* batuta becomes the host package for every CLI

### Features

* batuta becomes the host package for every CLI ([cd8957d](https://github.com/batuta-ai/batuta/commit/cd8957d1c18a9d76d4f58b572803661720ad58e0))


### Bug Fixes

* **claude:** hooks/hooks.json is auto-loaded; drop the duplicate manifest reference ([bd10c94](https://github.com/batuta-ai/batuta/commit/bd10c94fcb28327967d62ed769d6060945818368))
* **install:** target the antigravity agent id; skills land in the shared ~/.agents/skills ([0f4df80](https://github.com/batuta-ai/batuta/commit/0f4df806b700be153247a6fe3b28ec0263ab2f36))

## [0.2.14](https://github.com/franciscpd/batuta/compare/v0.2.13...v0.2.14) (2026-08-02)


### Features

* Compozy task board — WORK.md items as tasks, delegation as task runs ([0f8cb7c](https://github.com/franciscpd/batuta/commit/0f8cb7c11fc4229f35cb2beddc247785ee04232b))


### Bug Fixes

* compozy.md aligned with CLI 0.3.0 — overrides on session prompt, task child create and block --kind ([3e81b28](https://github.com/franciscpd/batuta/commit/3e81b28259e418382d5ca8c7e084f3adf1a7eaca))
* task retry takes the run id; a definitive abort cancels the board task ([116127f](https://github.com/franciscpd/batuta/commit/116127f633aeb3e2bd50a8101fe6ce805a3856ec))

## [0.2.13](https://github.com/franciscpd/batuta/compare/v0.2.12...v0.2.13) (2026-08-01)


### Features

* offer the Batuta discovery pointer in AGENTS.md ([3bd50fd](https://github.com/franciscpd/batuta/commit/3bd50fd1b7a3ba1272a3af161c329021b5935d62))


### Bug Fixes

* explicit pointer idempotency and reconfigure reconciliation ([d818f5d](https://github.com/franciscpd/batuta/commit/d818f5d5f04080c81f61fef4ffdd2f4ff4df1e95))

## [0.2.12](https://github.com/franciscpd/batuta/compare/v0.2.11...v0.2.12) (2026-08-01)


### Features

* Compozy runtime integration — dormant compozy.md and delegation as a managed session ([24e5a80](https://github.com/franciscpd/batuta/commit/24e5a80b563e5ed3d27420f097d54e8ba61b8925))
* Compozy runtime in init, status and pause — offer, listing and session handoff ([6264d19](https://github.com/franciscpd/batuta/commit/6264d1939c42e25f55367fc9173ebd74c3a8f0c0))


### Bug Fixes

* compozy.md — the scout never becomes a session, reconciling the critical-lane exception ([b5b107e](https://github.com/franciscpd/batuta/commit/b5b107e700509c9f5c9f8a0f7a42f2d1b20e5cdd))
* explicit worktree on spawn, critical-lane carve-out and session lifecycle ([6c860ea](https://github.com/franciscpd/batuta/commit/6c860ea8c64b9aa55e33c5a368e239501da4eeff))

## [0.2.11](https://github.com/franciscpd/batuta/compare/v0.2.10...v0.2.11) (2026-08-01)


### Features

* run the scope check when a brief is associated ([8d7145c](https://github.com/franciscpd/batuta/commit/8d7145ca5b32e39bb70ac461759441304b44d2c0))


### Bug Fixes

* the brief field list in codex-plugin.md reflects the current Step 2 ([b5fca5a](https://github.com/franciscpd/batuta/commit/b5fca5a6e0ed73d9c224e287d399002645eed8d8))

## [0.2.10](https://github.com/franciscpd/batuta/compare/v0.2.9...v0.2.10) (2026-08-01)


### Features

* declared scope in the brief — Scope field in Step 2 and mechanical check in Step 4 ([9025a03](https://github.com/franciscpd/batuta/commit/9025a03143b4038a1bb2cc16c15bfa8d95ae294a))
* run trail — .batuta/runs/ per task with a dormant runs.md ([7c80e23](https://github.com/franciscpd/batuta/commit/7c80e2339312178201bd7b5831000c909b365bf1))


### Bug Fixes

* aborted-item trail in Step 4, path-complete scope check and review adjustments ([ffc4636](https://github.com/franciscpd/batuta/commit/ffc46367f580ad4852ad37201b6dbb0929bbe8ac))

## [0.2.9](https://github.com/franciscpd/batuta/compare/v0.2.8...v0.2.9) (2026-07-27)


### Bug Fixes

* Step 0 gate — meta-questions about integrations read the integration file before answering ([e68d154](https://github.com/franciscpd/batuta/commit/e68d1547d1a0ab959be8b7f19a366573887e390c))

## [0.2.8](https://github.com/franciscpd/batuta/compare/v0.2.7...v0.2.8) (2026-07-26)


### Features

* hardened brief — expected evidence, stop conditions and anti-workaround (distillation wave 2) ([7720eda](https://github.com/franciscpd/batuta/commit/7720eda846f27d6df755b6ab4ce050e0b135c25e))
* cross-review contract — lenses, findings as artifact and the maestro's judgment (distillation wave 3) ([b1e5ac2](https://github.com/franciscpd/batuta/commit/b1e5ac2fb72d4f765a2a6643aa7cbe95df461495))
* hardened verification — a report is not evidence (distillation wave 1) ([b1548cd](https://github.com/franciscpd/batuta/commit/b1548cdc90cfa124f07941afb41282ae010755fc))

## [0.2.7](https://github.com/franciscpd/batuta/compare/v0.2.6...v0.2.7) (2026-07-26)


### Features

* catalog note and Never blocks in the existing templates ([25600e7](https://github.com/franciscpd/batuta/commit/25600e74370e7f5b8083244aeb3e1c9202fbad37))
* NestJS template and the full catalog in init ([8c9a9c0](https://github.com/franciscpd/batuta/commit/8c9a9c021f0857cc39a87e9734221d418fc5c23b))
* Next.js and React Native templates ([ea87942](https://github.com/franciscpd/batuta/commit/ea87942b7235a4e40c9b93cdcd8484c7e5ae5858))
* Python and Laravel templates ([91a00a4](https://github.com/franciscpd/batuta/commit/91a00a413a8f97e622ea526160350102fcfe32e8))


### Bug Fixes

* final review findings on the stack templates (Extends chain, restored guards) ([b8065fc](https://github.com/franciscpd/batuta/commit/b8065fce89ce43366c5b9d3cf63ccc54c045dac9))

## [0.2.6](https://github.com/franciscpd/batuta/compare/v0.2.5...v0.2.6) (2026-07-26)


### Features

* the cycle points at codex-plugin.md in Steps 2–4 ([dcd142c](https://github.com/franciscpd/batuta/commit/dcd142cfc0dbeb3b0575d296ac45742f3549414f))
* codex-plugin.md — central integration (borrowed muscle, Batuta's rules) ([f901ceb](https://github.com/franciscpd/batuta/commit/f901ceb5a327229a2ba1e060a91ef80422781f48))
* review and the codex adapter point at codex-plugin.md ([118dac5](https://github.com/franciscpd/batuta/commit/118dac551a643684b23b028cc681c8705d115c49))


### Bug Fixes

* final review findings on the codex plugin integration (write guard, wording) ([8dcab3c](https://github.com/franciscpd/batuta/commit/8dcab3c413770d2facf96192ac325b8241f66f28))

## [0.2.5](https://github.com/franciscpd/batuta/compare/v0.2.4...v0.2.5) (2026-07-22)


### Features

* the cycle gains the per-task worktree path (Steps 1.5, 3–5) ([3dfee54](https://github.com/franciscpd/batuta/commit/3dfee54ae6b114b66379b8f4f0ba1afa900c5468))
* ask for the worktree mode and the install command ([33b11d2](https://github.com/franciscpd/batuta/commit/33b11d23bbfdf40ae048502cc5d1e64c3850d1b5))


### Bug Fixes

* final review findings on per-task worktrees (wording, counts, fallback and guards) ([24b4e10](https://github.com/franciscpd/batuta/commit/24b4e10cc733ea68a69ac5ece791a36af0288359))

## [0.2.4](https://github.com/franciscpd/batuta/compare/v0.2.3...v0.2.4) (2026-07-22)


### Features

* the cycle points at superpowers.md in Steps 1–4 ([6ba5be1](https://github.com/franciscpd/batuta/commit/6ba5be13f5fef40733644dbb98687f6d375ce98c))
* plan and review point at superpowers.md ([8097932](https://github.com/franciscpd/batuta/commit/809793299fc400a1071f3809dc3e2b96d633230c))
* superpowers.md — central integration (borrowed method, Batuta's rules) ([98db01d](https://github.com/franciscpd/batuta/commit/98db01d0451fca1399b04508a8af760b10eecc1f))


### Bug Fixes

* prose of the cycle pointers (Step 4 before the list, line breaks) ([8a481d9](https://github.com/franciscpd/batuta/commit/8a481d9e0e2d18b50cc1ea38b7aba83688d653cc))

## [0.2.3](https://github.com/franciscpd/batuta/compare/v0.2.2...v0.2.3) (2026-07-21)


### Bug Fixes

* align docs and skills with the sequential decomposition default ([a4b2b78](https://github.com/franciscpd/batuta/commit/a4b2b78885e1ad56548d5bb8c1ab3e0d2c895b6c))

## [0.2.2](https://github.com/franciscpd/batuta/compare/v0.2.1...v0.2.2) (2026-07-21)


### Features

* init asks batch execution mode (sequential default) ([1350331](https://github.com/franciscpd/batuta/commit/135033164ab7bbe1495ad277558ecadf2b632acc))
* Step 1.5 Decompose — full cycle and atomic commit per item ([a4506ec](https://github.com/franciscpd/batuta/commit/a4506ecb588d3e7b4e99ae82cd5f65caca029c46))

## [0.2.1](https://github.com/franciscpd/batuta/compare/v0.2.0...v0.2.1) (2026-07-20)


### Bug Fixes

* README points the quickstart at init; PRD wording adjustments ([45ec178](https://github.com/franciscpd/batuta/commit/45ec178708b94cd278bb6164d4fe97081a2bcdae))

## [0.2.0](https://github.com/franciscpd/batuta/compare/v0.1.5...v0.2.0) (2026-07-20)


### ⚠ BREAKING CHANGES

* commands renamed — plan, status, route and review without prefix

### Features

* init skill — onboarding moved and reconfigure mode ([913e785](https://github.com/franciscpd/batuta/commit/913e785e298985c54448e1c4fbfb17a63256364c))
* pause and resume skills — consumable session handoff ([2a0673e](https://github.com/franciscpd/batuta/commit/2a0673ec76142d6c6cc5eb04f3c21ab32f1539b8))


### Code Refactoring

* commands renamed — plan, status, route and review without prefix ([d88a30b](https://github.com/franciscpd/batuta/commit/d88a30bcc84d321b624613d0532bd2fad057bcf4))

## [0.1.5](https://github.com/franciscpd/batuta/compare/v0.1.4...v0.1.5) (2026-07-20)


### Bug Fixes

* map sweep deferred until after lane mapping, scout guard under parallelism ([974098a](https://github.com/franciscpd/batuta/commit/974098a710d9ae1a26d33416370e2f2bfca710d9))

## [0.1.4](https://github.com/franciscpd/batuta/compare/v0.1.3...v0.1.4) (2026-07-20)


### Features

* read-only research invocation in the adapters (sandbox, blocked tools, git guard) ([d9946c7](https://github.com/franciscpd/batuta/commit/d9946c77bfbb3c543a082490ea21e4f9f871da7a))
* Research support lane in the routing table — the scout ([0c81b40](https://github.com/franciscpd/batuta/commit/0c81b40b486b2057c3aa411884aa273739945b5f))
* scout protocol in the cycle — research brief, report contract and structural verification ([39b6054](https://github.com/franciscpd/batuta/commit/39b6054b410d70e7188a992ad4caad4c8871f019))

## [0.1.3](https://github.com/franciscpd/batuta/compare/v0.1.2...v0.1.3) (2026-07-20)


### Features

* Claude variant on the complex lane — background opus as an alternative to codex ([c009027](https://github.com/franciscpd/batuta/commit/c0090278415c3534ffef4099ea15bd609109fafe))

## [0.1.2](https://github.com/franciscpd/batuta/compare/v0.1.1...v0.1.2) (2026-07-20)


### Features

* complex lane delegable to codex and user-chosen lane mapping ([4e757d7](https://github.com/franciscpd/batuta/commit/4e757d772ca966de202c04e4d2dade0598a3d821))
