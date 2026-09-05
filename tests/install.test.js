// Behaviour of bin/install.js main(): failures propagate, dependent steps
// stop, the exit code says so. Nothing here touches the machine.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { main } = require("../bin/install.js");

function host(id, steps, after) {
  return { id, label: id, detect: () => true, steps, after, note: "" };
}

function quiet(fn) {
  const log = console.log, err = console.error, lines = [];
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => lines.push(a.join(" "));
  try { return { code: fn(), lines }; } finally { console.log = log; console.error = err; }
}

test("every step succeeds → exit 0 and the first-run hint", () => {
  const ran = [];
  const { code, lines } = quiet(() => main(["--no-core"], { hosts: [host("a", ["s1", "s2"])], run: (s) => ran.push(s) }));
  assert.equal(code, 0);
  assert.deepEqual(ran, ["s1", "s2"]);
  assert.ok(lines.some((l) => l.trim().startsWith("Next:")));
});

test("a failing step stops that host, skips its after hook and exits 1", () => {
  let afterCalled = false;
  const ran = [];
  const hosts = [
    host("a", ["s1", "s2"], () => { afterCalled = true; }),
    host("b", ["s3"]),
  ];
  const run = (s) => { ran.push(s); if (s === "s1") throw new Error("boom"); };
  const { code, lines } = quiet(() => main(["--no-core"], { hosts, run }));
  assert.equal(code, 1);
  assert.deepEqual(ran, ["s1", "s3"], "s2 must not run after s1 failed; host b still runs");
  assert.equal(afterCalled, false);
  assert.ok(lines.some((l) => l.trim().startsWith("Failed: a")));
  assert.ok(!lines.some((l) => l.trim().startsWith("Next:")));
});

test("a failing core install exits 1", () => {
  const { code } = quiet(() => main([], { hosts: [host("a", [])], run: () => {}, installCore: () => { throw new Error("go missing"); } }));
  assert.equal(code, 1);
});

test("--only with an unknown host exits 2", () => {
  const { code } = quiet(() => main(["--only", "nope"], { hosts: [host("a", [])], run: () => {} }));
  assert.equal(code, 2);
});

test("the Codex step names the marketplace", () => {
  const { HOSTS } = require("../bin/install.js");
  const codex = HOSTS.find((h) => h.id === "codex");
  assert.ok(codex.steps.includes("codex plugin add batuta@batuta"));
});
