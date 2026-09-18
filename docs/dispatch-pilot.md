# Dispatch pilot

Status: completed on 2026-09-18 with a negative strict-quality result and
inconclusive token-savings results.

## Verdict

Nine first attempts completed: localization, a small regression fix, and an
independent review across legacy CLI, compact CLI, and compact ACP. There were
no retries, reported transport failures, timeouts, or uncertain submissions.
Six attempts met the exact task contract: legacy CLI 1/3, compact CLI 3/3, and
compact ACP 2/3. The desired three successful matched pairs were therefore not
achieved, and strict-quality equivalence failed.

The three rejected answers were semantically correct but violated their exact
output contracts. Legacy localization wrapped both required lines in backticks.
Legacy review omitted the `FILE:` prefix and source line and added backticks.
ACP review supplied the correct four-line finding but appended a completion
sentence. These outcomes remain rejected; no retry was used to manufacture a
passing matrix.

The proposed 30% reduction in median conductor tokens is **inconclusive**:
actual conductor counters were unavailable. The no-more-than-5% growth target
for median total tokens is also **inconclusive** because normalized comparable
totals were unavailable. The pilot does not qualify a broader provider cohort,
support a production-generalization claim, or change rollout: ACP remains
opt-in.

## Cohort and method

The synthetic fixture was a tiny, deterministic, dependency-free two-package
Go module in the current test environment. It had no network, clock,
randomness, or external-service dependency, so the result is limited to small,
bounded Go tasks. Every attempt used a fresh fixture and session, a 90-second
task timeout, a 120-second wall bound, and the same core wrapper. The frozen
fixture Git tree was `01ee358c099b096486c146ac3409835cd10f32e6`; its tree
SHA-256 was
`b9cf93087952e5f2639bf712132025680645ec249e09f191b6e7d64ceb5e2854`.
The private adapter SHA-256 was
`7399a25987bb31838f26a6f39ea9b28293653817c62a6460265cd690284533c8`.

The core was published `v1.1.0-beta.24` at
`b5cda7bbb4fc515415868058439f5658e321ae21`, with binary SHA-256
`56bb4856d0015e71a1a58f681cd69f95d8180f5117b9fce52e1ac879f8e06f49`
and archive SHA-256
`d12528c52ee3c7eb10e906beb5fc00bb64b98c139baefc7f2ec833cf3f229050`.
The tested skills candidate was
`1eab0f749f39fb73260c6fb5026899e8ed266859`; it is runtime-identical to
released skills `v0.11.0` at
`40edda8f3d0c8fc1fd26ebc5348209153cbd6e07`. The provider was OpenCode
`1.18.31`, executable SHA-256
`16c960ba77421da11b53e785f359b73f328a86118b48feb4af143db5d9afb198`,
on `darwin/arm64`, using `opencode/big-pickle` with empty effort. The native
host cohort was ineligible because the host could not select that exact model.

Legacy packets used the expanded eight-section Batuta brief and generic
conventions. Compact packets used condensed task instructions retaining the
same behavior, scope, permissions, acceptance proof, and output contract; the
wording was not necessarily verbatim identical. Both CLI variants used
pilot-only `--format json` instrumentation. ACP used `opencode acp`, the
`model` configuration ID, and the unchanged reject callback. Because every
variant went through the same core wrapper, “legacy CLI” is a representation
baseline rather than a literal replay of the historical raw CLI path.

The parent-owned gates required localization to name the exact file and
function without changing the tree; the fix to change only
`pkg/window/window.go`, pass public tests, and pass a hidden equality-at-limit
boundary test; and review to identify one source-backed defect with the exact
file, line, trigger, consequence, and minimal correction. All three fixes
changed `>` to `>=`, passed public and hidden boundary tests independently, and
preserved scope. All read-only worktrees remained unchanged. Parent source
inspection confirmed the semantic correctness of all three format-rejected
answers and explicitly accepted compact CLI review.

## Sanitized evidence

The following table contains all attempts, including failures. `Strict` is the
exact output/task-contract result. `Receipt` is the core receipt byte count;
`raw out` is instrumented worker stdout. `Legacy est.` is raw JSON-event stdout
plus stderr and is only a proxy for the former conductor-facing material.
Raw worker stderr was zero bytes in all nine attempts. ACP usage is raw
`input/cached-input/output` from
`acp/session-prompt/usage (draft)`; CLI usage was absent.

| Variant | Task | Strict | Latency ms | Prompt B | Receipt B | Raw out B | Legacy est. B | ACP usage |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Legacy CLI | Fix | pass | 37,055 | 2,903 | 661 | 23,160 | 23,160 | unknown |
| Legacy CLI | Localization | reject | 9,812 | 2,218 | 664 | 8,570 | 8,570 | unknown |
| Legacy CLI | Review | reject | 18,081 | 2,250 | 664 | 8,607 | 8,607 | unknown |
| Compact CLI | Fix | pass | 87,962 | 1,291 | 664 | 24,468 | — | unknown |
| Compact CLI | Localization | pass | 9,550 | 847 | 661 | 10,518 | — | unknown |
| Compact CLI | Review | pass | 23,726 | 992 | 664 | 13,274 | — | unknown |
| Compact ACP | Fix | pass | 46,286 | 1,291 | 809 | 1,225 | — | 155/22,784/319 |
| Compact ACP | Localization | pass | 15,766 | 847 | 808 | 54 | — | 215/20,480/94 |
| Compact ACP | Review | reject | 11,061 | 992 | 809 | 329 | — | 573/19,712/338 |

Accepted-only medians are explicitly conditional on passing attempts and thus
use different sample counts: legacy CLI (`n=1`) was 37,055 ms, 2,903 prompt
bytes, 661 receipt bytes, and 23,160 estimated legacy-receipt bytes; compact CLI
(`n=3`) was 23,726 ms, 992 prompt bytes, and 664 receipt bytes; compact ACP
(`n=2`) was 31,026 ms, 1,069 prompt bytes, and 808.5 receipt bytes.

For visibility into rejected attempts, all-attempt medians (`n=3` per variant)
were:

| Variant | Latency ms | Prompt B | Receipt B |
|---|---:|---:|---:|
| Legacy CLI | 18,081 | 2,250 | 664 |
| Compact CLI | 23,726 | 992 | 664 |
| Compact ACP | 15,766 | 992 | 809 |

These medians can be recomputed directly by sorting each three-row variant in
the sanitized table. Accepted-only medians filter `Strict=pass` first; for the
two accepted ACP rows, the median is the arithmetic midpoint.

## Accounting and operational limits

Prompt bytes, raw CLI output, compact receipt bytes, and the legacy receipt
estimate are context-size proxies, not measured token savings, billing, quota,
or proof of a causal transport effect. JSON framing and different
representations further limit comparison. The draft ACP usage is preserved
with its provenance and is not normalized or summed: observed cached input is
larger than reported input, and the pilot does not assume shared cache
semantics. Actual conductor tokens, normalized totals, CLI usage, subscription
quota, API spend, and provider cost remain unknown.

CLI attempts inherited their existing permission policy. ACP retained the
production reject callback. Permission callbacks were not independently
counted, so no observed callback is not proof that no permission was requested.
All nine core invocations returned without a reported shutdown failure, which
is weaker than an independent whole-process-tree inspection. Arbitrary escaped
descendant containment remains unknown; this pilot performed no new PID sweep.
Global configuration and permissions were unchanged.

## Reproduction and evidence boundary

The comparison contract and accounting rules are in the public
[core measurement guide](https://github.com/batuta-ai/core/blob/b5cda7bbb4fc515415868058439f5658e321ae21/docs/dispatch-measurement.md),
and routing/acceptance expectations are in the released
[skills scenario guide](https://github.com/batuta-ai/skills/blob/40edda8f3d0c8fc1fd26ebc5348209153cbd6e07/docs/native-dispatch-scenarios.md).
To reproduce the pilot, verify the refs, executable and fixture hashes above;
create one fresh snapshot and session for each of the nine table cells; run
each once with the stated timeouts and unchanged permissions; apply the same
parent-owned source, tree, public-test, hidden-boundary, and exact-output gates;
retain failures without retry; then aggregate accepted-only and all-attempt
medians separately.

The local run directory retains manifests, observations, verifications,
parent assessments, and raw protocol logs. Those ignored artifacts are
available to the run owner for audit but are intentionally neither published
nor linked as retrievable GitHub evidence. This report contains the sanitized
rows needed to recompute its numeric claims without those private logs.
