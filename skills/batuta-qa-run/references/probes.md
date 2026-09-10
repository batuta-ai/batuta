# Probe catalog

Use this catalog while walking a charter. Pick one tour for its dominant risk,
apply all six experiential lenses during the journey, and choose only the edge
probes that fit the surface and time box. A probe is runnable only through a
public UI, CLI, or documented HTTP surface; confirm outcomes through a second
public read path such as a detail view, list command, status endpoint, export,
receipt, or notification.

## Contents

- Tour catalog
- Experiential lenses
- User edge probes
- Selection and writeback

## Tour catalog

Choose exactly one tour per charter. The actions are examples, not a checklist.
When a UI gesture is unavailable, reproduce its user-visible effect through a
public equivalent; if no equivalent exists, mark that leg blocked and name the
missing capability.

| Tour | Pick it for | Apply it headlessly | Evidence to retain |
|---|---|---|---|
| Feature | New or changed headline behavior | Complete the documented happy path and compare each promise with the observed result | Goal state plus an independent reread |
| Money | Checkout, plans, refunds, invoices, payouts, currencies | Exercise allowed test transactions, abandonment, rejection, cancellation, and rounding through public payment surfaces | Product status plus receipt, invoice, or provider-visible result |
| Garbage | Forms, uploads, search, comments, bulk input | Submit long, empty, oddly encoded, wrong-format, repeated, or rapidly duplicated input within published limits | Triggering input plus saved or rejected state |
| History | Multi-step flows, deep links, recovery, modal navigation | Revisit earlier public URLs, refresh mid-flow, reopen saved links, and repeat navigation requests | URLs, state before and after, and final persisted state |
| Concurrent session | Shared state across tabs, clients, or logins | Use two independent CLI sessions, HTTP clients, or browser contexts to edit, delete, log out, or invert an action | Both clients' reads at the divergence |
| Network | Any journey that performs I/O | Apply client throttling, timeout, disconnect, retry, and duplicate submission controls available to the host | Request timing or failure plus the reconciled public state |
| Locale | Text, numbers, dates, currency, scheduling | Set locale, language, timezone, Unicode, and text direction through public flags, headers, profiles, or browser settings | Requested locale plus rendered or serialized result |
| Paste and import | Prose or structured-data entry | Send realistic copied text: smart punctuation, tabs, line breaks, URLs, Unicode, and formatting residue | Original payload plus reopened, exported, or rendered value |
| Autofill and defaults | Auth, checkout, settings, or any prefilled form | Supply saved-value semantics with browser automation or the surface's public default/prefill mechanism, then submit without corrective edits | Prefilled state and persisted result; block only browser-owned behavior with no equivalent |
| Interrupt | Long forms, uploads, jobs, checkout, or mobile flows | Stop and resume the public client, expire credentials where supported, detach from long work, then return through the normal entry point | State before interruption and recovered final state |

## Experiential lenses

Hold every lens during the walk, then apply all six to the widest journeys in
the round. These are compact user checks, not substitutes for specialist audits.

| Lens | Pick the moments | Apply it headlessly | Failure signal |
|---|---|---|---|
| Usability | Decisions, waits, destructive actions, and repeated work | Inspect public copy, status, help, cancel/undo paths, naming consistency, and shortcuts through rendered output or interface metadata | The user must guess, remember hidden state, or cannot reverse or understand an action |
| Accessibility | Every interactive or meaning-bearing state | Inspect the accessibility tree or rendered markup; drive keyboard input where supported; check names, labels, focus order, headings, announcements, contrast metadata, zoom, and reduced-motion response | Meaning or completion depends on sight, color, pointer use, animation, or an unlabeled control |
| Perceived performance | Entry, submit, navigation, and long work | Measure wall-clock response at the public client under normal and constrained network conditions; attempt one action while loading | Blank or inert periods, late feedback, duplicate-action pressure, or success that fails to reconcile |
| Compatibility | Changed surfaces and format boundaries | Repeat the public contract across available browsers, viewports, clients, output formats, themes, and platform identifiers; record unavailable matrix cells as blocked | Equivalent supported clients produce incompatible behavior or unreadable output |
| Error recovery | Every failure encountered or deliberately induced | Read the public error, follow its stated recovery, retry through a fresh client, and verify whether input and committed state survive | Error lacks a next step, loses input, hides permanence, or leaves ambiguous state |
| Production parity | Setup and every qualified verdict | Compare public build/version, auth route, service endpoints, cache/profile conditions, extensions or client config, and network assumptions with the declared target | A mock, bypass, different artifact, or unrealistic client condition weakens the verdict |

## User edge probes

Select five to ten that match the persona and surface. Keep the first failure
when retrying. None requires private storage, source inspection, or a graphical
desktop; browser-specific mechanics may use headless browser automation, and a
missing browser capability blocks only that probe.

### Navigation and continuity

| Probe | Apply it | Look for |
|---|---|---|
| Refresh during submit | Interrupt the response, then reload or repeat the public read | Duplicate action, missing confirmation, or ghost state |
| Return after success | Revisit the prior or success URL, or repeat its CLI/HTTP entry request | Re-fired action, stale success, or broken recovery link |
| Leave mid-entry | Save partial input if offered, leave, and enter again normally | Lost input, unfair validation, or false completion |
| Deep link later | Capture an intermediate public URL or command and revisit with a fresh session | Missing prerequisites, redirect loop, or partial state leak |
| Two-client collision | Read or edit the same resource from two isolated clients | Lost update, stale read, wrong-account action, or no recovery |
| Missing resource | Request a removed or malformed public identifier | Dead end, leaked detail, or absent route back to safety |

### Input and submission

| Probe | Apply it | Look for |
|---|---|---|
| Duplicate submit | Send the same allowed action twice before reconciling the first | Duplicate record, charge, message, or job |
| Out-of-order entry | Populate optional and later fields before required earlier fields | Premature validation, reset, or dependency confusion |
| Empty entry | Submit through the public surface with no user values | Clear, proximal errors and focus or field identification |
| Copied prose | Enter smart punctuation, Unicode, line breaks, tabs, and long realistic text | Corruption, truncation, escaped display, or downstream breakage |
| Wrong-place value | Put a URL, date style, or structured value into another ordinary field | Surprise coercion, auto-linking, or misleading validation |
| File misplacement | Submit a file to the wrong public target or an unsupported file to the right one | Navigation away, lost work, or unclear rejection |
| Assisted entry | Use public prefill, password-manager automation, dictation text, or saved defaults | Wrong field, stale value, validation race, or silent normalization |

### Session, identity, and timing

| Probe | Apply it | Look for |
|---|---|---|
| Expiry mid-work | Use a short-lived test session or resume after documented expiry | Lost work, login loop, or wrong post-login destination |
| Identity changes elsewhere | Authenticate or sign out as another allowed account in a second client | Cross-session contamination or action under the wrong identity |
| Repeated sign-in | Start the public authentication entry twice in quick succession | Redirect loop, duplicate account, or stuck state |
| Restricted cookies | Run the auth journey with supported cookie restrictions | Silent breakage or absent recovery guidance |
| Slow response | Add client-side latency or use a throttled headless browser | Inert UI, endless wait, duplicate-action pressure, or timeout ambiguity |
| Drop and resume | Disconnect the public client mid-request, reconnect, then reread | Lost data, unsafe retry, or false optimistic success |
| Long task | Start work exceeding the normal response window, detach, and return | No progress, cancellation, durable job id, or completion path |
| Clock boundary | Use public timezone/locale inputs around midnight, DST, or expiry boundaries | Shifted date, premature expiry, or inconsistent billing window |

### Device, locale, and access

| Probe | Apply it | Look for |
|---|---|---|
| Narrow and wide layouts | Render with headless viewports from 320px through a wide desktop | Covered content, unreachable action, or drifting layout |
| Orientation change | Resize a headless mobile context during the journey | Lost focus, state, scroll position, or modal placement |
| Zoom and text scale | Render at supported zoom or emulate larger text | Overlap, clipping, or hidden controls |
| Theme and contrast | Request light, dark, high-contrast, and reduced-motion modes | Invisible meaning, hardcoded color, or missing feedback |
| Long and bidirectional text | Set a public locale or enter long German, Arabic, and CJK text | Overflow, wrong direction, encoding, search, or sort behavior |
| Keyboard path | Drive the whole journey with keyboard events in a headless browser | Trap, invisible focus, illogical order, or pointer-only action |
| Assistive semantics | Inspect the headless accessibility tree and live-state changes | Missing names, hierarchy, status announcement, or state |

### Interrupt, trust, and recovery

| Probe | Apply it | Look for |
|---|---|---|
| Client restart | Stop the browser context or CLI during long work and reopen normally | Silent failure, duplicate restart, or no resumable state |
| Delayed return | Abandon the journey, then return after its documented session window | Wrong resume point, unexplained expiry, or stale action |
| Error revisits | Reopen a public failure immediately and after a clean session | Cached failure, apology loop, or inconsistent recovery |
| Old link | Visit a superseded public route from a fresh client | Bad redirect, context loss, or unrecoverable not-found page |
| Shared private link | Open an authenticated resource link while signed out or as another allowed user | Detail leakage or broken sign-in handoff |
| Cross-client sign-in link | Open an allowed one-time link in a different clean client | Unexplained binding, token loss, or unsafe reuse |

## Selection and writeback

1. Bind the charter to the one tour that best matches its dominant risk.
2. Choose relevant edge probes; do not spend the box sampling the whole catalog.
3. Hold all six lenses during the walk and note which widest journeys received the dedicated pass.
4. For every attempt, record probe, persona, journey step, client, public action, independent read path, evidence location, and verdict.
5. Mark a leg `Blocked` only when its public surface or required host capability is unavailable, and record the exact prerequisite. Continue every other reachable leg.
6. Send each failure to the shared bug registry; attempted-and-clean probes remain evidence in the session debrief.
