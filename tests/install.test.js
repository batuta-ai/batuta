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

test("installSharedSkills copies the vendored tree, replaces stale files and writes the lock", () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { installSharedSkills } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-skills-"));
  const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
  fs.mkdirSync(path.join(src, "batuta", "references"), { recursive: true });
  fs.writeFileSync(path.join(src, "batuta", "SKILL.md"), "new");
  fs.writeFileSync(path.join(src, "batuta", "references", "a.md"), "a");
  fs.writeFileSync(path.join(src, "README.md"), "not a skill dir");
  fs.mkdirSync(path.join(dst, "batuta"), { recursive: true });
  fs.writeFileSync(path.join(dst, "batuta", "stale.md"), "old");
  fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v9.9.9", computedHash: "sha256:x" }));
  quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
  assert.equal(fs.readFileSync(path.join(dst, "batuta", "SKILL.md"), "utf8"), "new");
  assert.equal(fs.readFileSync(path.join(dst, "batuta", "references", "a.md"), "utf8"), "a");
  assert.ok(!fs.existsSync(path.join(dst, "batuta", "stale.md")), "stale files are removed");
  assert.ok(!fs.existsSync(path.join(dst, "README.md")), "only skill directories are copied");
  const lock = JSON.parse(fs.readFileSync(path.join(dst, ".batuta-skills-lock.json"), "utf8"));
  assert.equal(lock.ref, "v9.9.9");
  assert.deepEqual(lock.skills, ["batuta"]);
  assert.ok(lock.installedAt);
});

test("installSharedSkills keeps the previous installation when the copy fails and retires dropped skills", () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { installSharedSkills } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-skills-"));
  const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
  fs.mkdirSync(path.join(src, "batuta"), { recursive: true });
  fs.writeFileSync(path.join(src, "batuta", "SKILL.md"), "new");
  fs.mkdirSync(path.join(dst, "batuta"), { recursive: true });
  fs.writeFileSync(path.join(dst, "batuta", "SKILL.md"), "old");
  fs.mkdirSync(path.join(dst, "batuta-retired"), { recursive: true });
  fs.writeFileSync(path.join(dst, ".batuta-skills-lock.json"), JSON.stringify({ ref: "v1", skills: ["batuta", "batuta-retired"] }));
  // A missing source lock makes the run fail after the copy; the previous install must survive an earlier failure too.
  fs.writeFileSync(lockSrc, "not json");
  assert.throws(() => quiet(() => installSharedSkills(false, { src, dst, lockSrc })));
  // A copy that fails on the second skill after the first was staged: nothing is swapped in.
  fs.mkdirSync(path.join(src, "batuta-second"), { recursive: true });
  fs.writeFileSync(path.join(src, "batuta-second", "SKILL.md"), "x");
  fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v2" }));
  let calls = 0;
  // The second copy writes half a tree, then fails: the partial staging directory must go too.
  const copy = (from, to) => { calls++; fs.cpSync(from, to, { recursive: true }); if (calls === 2) throw new Error("EIO"); };
  fs.writeFileSync(path.join(dst, ".batuta-skills-lock.json"), JSON.stringify({ ref: "v1", skills: ["batuta", "batuta-retired", "..", "../escape"] }));
  fs.mkdirSync(path.join(tmp, "escape"), { recursive: true });
  assert.throws(() => quiet(() => installSharedSkills(false, { src, dst, lockSrc, copy })), /EIO/);
  assert.equal(fs.readFileSync(path.join(dst, "batuta", "SKILL.md"), "utf8"), "old", "previous installation untouched");
  assert.ok(!fs.existsSync(path.join(dst, "batuta-second")), "the second skill was never installed");
  assert.ok(!fs.readdirSync(dst).some((n) => n.endsWith(".staging")), "no staging directories left behind");
  assert.ok(fs.existsSync(path.join(dst, "batuta-retired")), "nothing retired on a failed run");
  quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
  assert.equal(fs.readFileSync(path.join(dst, "batuta", "SKILL.md"), "utf8"), "new");
  assert.ok(!fs.existsSync(path.join(dst, "batuta-retired")), "skills dropped by the release are removed");
  assert.ok(fs.existsSync(path.join(tmp, "escape")), "lock entries that are not skill names are never deleted");
  assert.ok(fs.existsSync(src), "a `..` entry cannot delete the parent");
});
