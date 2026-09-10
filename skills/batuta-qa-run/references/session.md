# Persona session protocol

Use this protocol for one charter at a time. The session measures what its
persona can do through the product, while its dated report preserves the proof.

## Public-interface rule

Interact only through UI, installed CLI, or documented HTTP interfaces a real
user can reach. Enter as the charter's persona, with only the knowledge the
product gives that persona. Verify through public reads such as a fresh page,
list or detail view, export, delivered message, separate CLI command, or
documented GET endpoint. Never inspect source, private storage, internal logs or
endpoints, fixtures, or flags to decide whether a step passed.

Keep evaluator language out of anything the product consumes. Prompts, form
entries, commands, and support messages should express the persona's real goal;
put ids, expected results, and grading language only in the session record.

## Prepare the session

- Adopt the charter's entry point, account or role, device, network, locale,
  interaction modality, and patience. Record any condition the host cannot set.
- Start clean, except for state a returning persona would legitimately retain.
- Read the charter and journey before entering, then stop consulting private
  implementation details until the session leg ends.

## Enter, act, verify, capture

For every journey step:

1. **Enter or observe** the current public state as the persona encounters it.
2. **Act** using the interface and behavior that persona would choose.
3. **Verify** the named observable within the persona's patience window, then
   confirm durable state through a separate public read path.
4. **Capture** the exact input, observable output, timing when relevant, and an
   evidence path at the goal state or any divergence.
5. **Continue** along the charter's branch or abandonment path, recording
   `pass`, `friction`, `fail`, or an exact blocked prerequisite.

A pass requires the intended, user-visible result, its independent reread, and
auditable evidence. For durable changes, refresh or revisit the object directly;
a write response, optimistic display, route render, or item count alone is not
proof. Tie captures to the object and action from this session.

## Journey instruments

Browser, CLI, and HTTP are equal first-class journey surfaces. A browser is an
optional instrument among several; mark an unsupported browser-only leg blocked
with its exact prerequisite. With a browser, capture checkpoint or failure screenshots and
refresh or revisit through another user-reachable view. With a CLI, record the
exact command, input, and output, then confirm through a separate public command.
With HTTP, record the documented request and response, then use an independently
authenticated public read endpoint to confirm the same object and state.

## Stalls and blocked legs

A hang, silent command, dead control, or unreachable next step is a finding.
Capture the state, elapsed time, and attempted action; record the verdict and
deduplicate the bug. One retry from a clean session is allowed because a real
user may retry once, but retain the first failure. Never prompt, refresh, patch,
or use privileged access to push the product beyond the stall.

When the public path genuinely needs a person or unavailable host capability,
mark the leg blocked and name the precise missing human action, browser feature,
account or role, reachable service, credential, or decision. Continue independent
CLI, HTTP, or other public legs that remain runnable.

## Writeback

After each charter, update its matrix row and append a debrief to the dated
report: persona and entry, attempted actions, observed results, public rereads,
evidence paths, timing, true end state, branches, paper cuts, linked bugs, and
scenario verdicts. Update scenario files and the shared bug registry at the
same time. A session absent from the tree did not happen.
