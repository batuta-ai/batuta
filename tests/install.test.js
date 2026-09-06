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

async function quietAsync(fn) {
  const log = console.log, err = console.error, lines = [];
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => lines.push(a.join(" "));
  try { return { code: await fn(), lines }; } finally { console.log = log; console.error = err; }
}

test("every step succeeds → exit 0 and the first-run hint", async () => {
  const ran = [];
  const { code, lines } = await quietAsync(() => main(["--no-core"], { hosts: [host("a", ["s1", "s2"])], run: (s) => ran.push(s) }));
  assert.equal(code, 0);
  assert.deepEqual(ran, ["s1", "s2"]);
  assert.ok(lines.some((l) => l.trim().startsWith("Next:")));
});

test("a failing step stops that host, skips its after hook and exits 1", async () => {
  let afterCalled = false;
  const ran = [];
  const hosts = [
    host("a", ["s1", "s2"], () => { afterCalled = true; }),
    host("b", ["s3"]),
  ];
  const run = (s) => { ran.push(s); if (s === "s1") throw new Error("boom"); };
  const { code, lines } = await quietAsync(() => main(["--no-core"], { hosts, run }));
  assert.equal(code, 1);
  assert.deepEqual(ran, ["s1", "s3"], "s2 must not run after s1 failed; host b still runs");
  assert.equal(afterCalled, false);
  assert.ok(lines.some((l) => l.trim().startsWith("Failed: a")));
  assert.ok(!lines.some((l) => l.trim().startsWith("Next:")));
});

test("a failing core install exits 1", async () => {
  const { code } = await quietAsync(() => main([], { hosts: [host("a", [])], run: () => {}, installCore: async () => { throw new Error("go missing"); } }));
  assert.equal(code, 1);
});

test("--only with an unknown host exits 2", async () => {
  const { code } = await quietAsync(() => main(["--only", "nope"], { hosts: [host("a", [])], run: () => {} }));
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

test("downloadCore verifies the checksum and installs the binary from the release archive", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const crypto = require("node:crypto");
  const { execFileSync } = require("node:child_process");
  const { downloadCore, coreAsset, expectedChecksum, CORE_VERSION } = require("../bin/install.js");
  assert.match(CORE_VERSION, /^v\d+\.\d+\.\d+(-beta\.\d+)?$/);
  assert.equal(coreAsset("darwin", "arm64"), "batuta_darwin_arm64.tar.gz");
  assert.equal(coreAsset("linux", "x64"), "batuta_linux_amd64.tar.gz");
  assert.equal(coreAsset("win32", "x64"), null);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-dl-"));
  const src = path.join(tmp, "src");
  fs.mkdirSync(src);
  fs.writeFileSync(path.join(src, "batuta"), "#!/bin/sh\necho v-test\n");
  fs.chmodSync(path.join(src, "batuta"), 0o755);
  const archive = path.join(tmp, "batuta_linux_amd64.tar.gz");
  execFileSync("tar", ["-czf", archive, "-C", src, "batuta"]);
  const bytes = fs.readFileSync(archive);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const checksums = `${sha}  batuta_linux_amd64.tar.gz\n0000000000000000000000000000000000000000000000000000000000000000  batuta_darwin_arm64.tar.gz\n`;
  assert.equal(expectedChecksum(checksums, "batuta_linux_amd64.tar.gz"), sha);
  assert.equal(expectedChecksum(checksums, "missing.tar.gz"), null);

  const served = { "checksums.txt": Buffer.from(checksums), "batuta_linux_amd64.tar.gz": bytes };
  const fetched = [];
  const fakeFetch = async (url) => {
    fetched.push(url);
    const name = url.split("/").pop();
    if (!served[name]) return { ok: false, status: 404 };
    return { ok: true, status: 200, arrayBuffer: async () => served[name] };
  };
  const binDir = path.join(tmp, "bin");
  const target = await downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel" });
  assert.equal(target, path.join(binDir, "batuta"));
  assert.equal(fs.readFileSync(target, "utf8"), "#!/bin/sh\necho v-test\n");
  assert.ok(fs.statSync(target).mode & 0o100, "binary is executable");
  assert.deepEqual(fetched, ["https://example.test/rel/checksums.txt", "https://example.test/rel/batuta_linux_amd64.tar.gz"]);

  // A tampered archive never reaches binDir.
  served["batuta_linux_amd64.tar.gz"] = Buffer.concat([bytes, Buffer.from("x")]);
  fs.writeFileSync(target, "previous");
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel" }), /checksum mismatch/);
  assert.equal(fs.readFileSync(target, "utf8"), "previous");
  // Darwin/arm64 is listed with a bogus hash; a 404 on the archive is reported as such.
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "darwin", arch: "arm64", baseUrl: "https://example.test/rel" }), /HTTP 404/);
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "win32", arch: "x64" }), /no prebuilt batuta/);
});

test("installBinary never follows a pre-existing path and leaves no stub on failure", () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { installBinary } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-bin-"));
  const victim = path.join(tmp, "victim");
  fs.writeFileSync(victim, "keep me");
  fs.symlinkSync(victim, path.join(tmp, "batuta.new"));
  fs.symlinkSync(victim, path.join(tmp, "batuta"));
  const target = installBinary(Buffer.from("#!/bin/sh\necho ok\n"), tmp);
  assert.equal(fs.readFileSync(victim, "utf8"), "keep me", "a symlink at the destination is replaced, never written through");
  assert.ok(!fs.lstatSync(target).isSymbolicLink(), "the installed batuta is a regular file");
  assert.equal(fs.readFileSync(target, "utf8"), "#!/bin/sh\necho ok\n");
  assert.ok(fs.statSync(target).mode & 0o100);
  assert.deepEqual(fs.readdirSync(tmp).filter((n) => n.startsWith(".batuta.")), [], "no staging file left behind");
  // Read-only directory: the failure leaves nothing behind either.
  const ro = path.join(tmp, "ro");
  fs.mkdirSync(ro);
  fs.chmodSync(ro, 0o555);
  try {
    if (process.getuid && process.getuid() !== 0) {
      assert.throws(() => installBinary(Buffer.from("x"), ro), /EACCES|EPERM/);
      assert.deepEqual(fs.readdirSync(ro), []);
    }
  } finally { fs.chmodSync(ro, 0o755); }
});

test("downloadCore rejects an archive whose batuta member is not a regular file", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const crypto = require("node:crypto");
  const { execFileSync } = require("node:child_process");
  const { downloadCore } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-dl2-"));
  const src = path.join(tmp, "src");
  fs.mkdirSync(src);
  fs.writeFileSync(path.join(src, "real"), "not the binary");
  fs.symlinkSync("real", path.join(src, "batuta"));
  const archive = path.join(tmp, "batuta_linux_amd64.tar.gz");
  execFileSync("tar", ["-czf", archive, "-C", src, "batuta", "real"]);
  const bytes = fs.readFileSync(archive);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const served = { "checksums.txt": Buffer.from(`${sha}  batuta_linux_amd64.tar.gz\n`), "batuta_linux_amd64.tar.gz": bytes };
  const fakeFetch = async (url) => ({ ok: true, status: 200, arrayBuffer: async () => served[url.split("/").pop()] });
  const binDir = path.join(tmp, "bin");
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel" }), /regular file named batuta/);
  assert.ok(!fs.existsSync(path.join(binDir, "batuta")));
  // Missing tar is reported as such, not as an empty "tar failed".
  const noTar = () => ({ status: null, error: new Error("spawnSync tar ENOENT") });
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", exec: noTar }), /tar is required/);
});
