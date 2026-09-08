// Behaviour of bin/install.js main(): failures propagate, dependent steps
// stop, the exit code says so. Nothing here touches the machine.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { main } = require("../bin/install.js");
const noShadow = { shadowSharedSkillsInCodex: () => [] };

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
  const { code, lines } = await quietAsync(() => main(["--no-core"], { ...noShadow,  hosts: [host("a", ["s1", "s2"])], run: (s) => ran.push(s) }));
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
  const { code, lines } = await quietAsync(() => main(["--no-core"], { ...noShadow,  hosts, run }));
  assert.equal(code, 1);
  assert.deepEqual(ran, ["s1", "s3"], "s2 must not run after s1 failed; host b still runs");
  assert.equal(afterCalled, false);
  assert.ok(lines.some((l) => l.trim().startsWith("Failed: a")));
  assert.ok(!lines.some((l) => l.trim().startsWith("Next:")));
});

test("a failing core install exits 1", async () => {
  const { code } = await quietAsync(() => main([], { ...noShadow,  hosts: [host("a", [])], run: () => {}, installCore: async () => { throw new Error("go missing"); } }));
  assert.equal(code, 1);
});

test("--help prints the usage and runs nothing", async () => {
  for (const flag of ["--help", "-h"]) {
    let ran = false;
    let core = false;
    const { code, lines } = await quietAsync(() => main([flag], {
      ...noShadow,
      hosts: [host("a", [])],
      run: () => { ran = true; },
      installCore: async () => { core = true; },
    }));
    assert.equal(code, 0);
    assert.equal(ran, false);
    assert.equal(core, false);
    for (const needle of [
      "npx -y github:batuta-ai/batuta -- <flags>",
      "--list",
      "--only <host>",
      "--all",
      "--dry-run",
      "--force-skills",
      "--no-core",
      "--help, -h",
    ]) {
      assert.ok(lines.some((l) => l.includes(needle)), needle);
    }
  }
});

test("--only with an unknown host exits 2", async () => {
  const { code } = await quietAsync(() => main(["--only", "nope"], { ...noShadow,  hosts: [host("a", [])], run: () => {} }));
  assert.equal(code, 2);
});

test("an unknown flag prints the usage and exits 2 without installing", async () => {
  let ran = false;
  let core = false;
  const { code, lines } = await quietAsync(() => main(["--only", "codex", "--bogus"], {
    ...noShadow,
    hosts: [host("a", [])],
    run: () => { ran = true; },
    installCore: async () => { core = true; },
  }));
  assert.equal(code, 2);
  assert.equal(ran, false);
  assert.equal(core, false);
  assert.ok(lines.some((l) => l.includes('Unknown flag "--bogus".')));
  for (const needle of [
    "npx -y github:batuta-ai/batuta -- <flags>",
    "--help, -h",
  ]) {
    assert.ok(lines.some((l) => l.includes(needle)), needle);
  }
});

test("plugin hosts refresh their marketplace before installing", () => {
  const { HOSTS } = require("../bin/install.js");
  const claude = HOSTS.find((h) => h.id === "claude"), codex = HOSTS.find((h) => h.id === "codex");
  assert.ok(claude.steps.indexOf("claude plugin marketplace update batuta") < claude.steps.findIndex((s) => s.startsWith("claude plugin install")));
  assert.ok(claude.steps.findIndex((s) => s.startsWith("claude plugin install")) < claude.steps.indexOf("claude plugin update batuta@batuta"));
  assert.ok(codex.steps.indexOf("codex plugin marketplace upgrade batuta") < codex.steps.findIndex((s) => s.startsWith("codex plugin add")));
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

test("treeHash distinguishes entry types, file boundaries, and empty directories", (t) => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const { treeHash } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-tree-hash-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const left = path.join(tmp, "left"), right = path.join(tmp, "right");
  fs.mkdirSync(left);
  fs.mkdirSync(right);
  fs.writeFileSync(path.join(left, "SKILL.md"), "link:/tmp/local-notes");
  fs.symlinkSync("/tmp/local-notes", path.join(right, "SKILL.md"));
  assert.notEqual(treeHash(left), treeHash(right), "file bytes cannot impersonate a symlink");
  fs.unlinkSync(path.join(left, "SKILL.md"));
  fs.unlinkSync(path.join(right, "SKILL.md"));
  fs.writeFileSync(path.join(left, "a"), "X");
  fs.writeFileSync(path.join(left, "b"), "Y");
  fs.writeFileSync(path.join(right, "a"), "Xb\0Y");
  assert.notEqual(treeHash(left), treeHash(right), "file bytes cannot impersonate another record");
  fs.writeFileSync(path.join(right, "a"), "X");
  fs.writeFileSync(path.join(right, "b"), "Y");
  assert.equal(treeHash(left), treeHash(right), "identical trees have the same hash");
  fs.mkdirSync(path.join(right, "empty"));
  assert.notEqual(treeHash(left), treeHash(right), "empty directories are entries too");
});

for (const kind of ["identical", "dangling"]) {
  test(`installSharedSkills keeps a ${kind} root symlink for replacement and retirement unless forced`, (t) => {
    const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
    const { installSharedSkills } = require("../bin/install.js");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-root-symlink-"));
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
    const source = path.join(src, "batuta"), target = path.join(dst, "batuta"), external = path.join(tmp, "external");
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(source, "SKILL.md"), "old");
    fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v1" }));
    quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
    const readLock = () => JSON.parse(fs.readFileSync(path.join(dst, ".batuta-skills-lock.json"), "utf8"));
    const managedHash = readLock().hashes.batuta;
    if (kind === "identical") fs.cpSync(target, external, { recursive: true });
    fs.rmSync(target, { recursive: true });
    fs.symlinkSync(external, target);
    fs.writeFileSync(path.join(source, "SKILL.md"), "new");
    for (const retire of [false, true]) {
      if (retire) fs.rmSync(source, { recursive: true });
      const { lines } = quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
      assert.ok(fs.lstatSync(target).isSymbolicLink());
      assert.equal(fs.readlinkSync(target), external);
      assert.ok(lines.includes("  kept batuta: customized locally; rerun with --force-skills to replace it"));
      assert.deepEqual(readLock().skills, ["batuta"]);
      assert.equal(readLock().hashes.batuta, managedHash);
    }
    quiet(() => installSharedSkills(false, { src, dst, lockSrc, force: true }));
    assert.equal(fs.lstatSync(target, { throwIfNoEntry: false }), undefined, "force retires even a dangling root symlink");
    assert.deepEqual(readLock().skills, []);

    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, "SKILL.md"), "new");
    fs.symlinkSync(external, target);
    quiet(() => installSharedSkills(false, { src, dst, lockSrc, force: true }));
    assert.ok(fs.lstatSync(target).isDirectory(), "force replaces a root symlink with the vendored directory");
    assert.equal(fs.readFileSync(path.join(target, "SKILL.md"), "utf8"), "new");
    if (kind === "identical") assert.equal(fs.readFileSync(path.join(external, "SKILL.md"), "utf8"), "old");
    else assert.equal(fs.lstatSync(external, { throwIfNoEntry: false }), undefined);
  });
}

test("installSharedSkills keeps a customized skill with a warning and replaces an unchanged skill", () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { installSharedSkills, treeHash } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-skills-customized-"));
  const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
  try {
    for (const name of ["customized", "unchanged"]) {
      fs.mkdirSync(path.join(src, name), { recursive: true });
      fs.mkdirSync(path.join(dst, name), { recursive: true });
      fs.writeFileSync(path.join(src, name, "SKILL.md"), `${name} new`);
    }
    fs.writeFileSync(path.join(dst, "customized", "SKILL.md"), "customized old");
    fs.writeFileSync(path.join(dst, "unchanged", "SKILL.md"), "unchanged old");
    const previousHashes = {
      customized: treeHash(path.join(dst, "customized")),
      unchanged: treeHash(path.join(dst, "unchanged")),
    };
    fs.writeFileSync(path.join(dst, "customized", "SKILL.md"), "locally edited");
    fs.writeFileSync(path.join(dst, ".batuta-skills-lock.json"), JSON.stringify({ ref: "v1", skills: ["customized", "unchanged"], hashes: previousHashes }));
    fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v2" }));

    const { lines } = quiet(() => installSharedSkills(false, { src, dst, lockSrc }));

    assert.equal(fs.readFileSync(path.join(dst, "customized", "SKILL.md"), "utf8"), "locally edited");
    assert.equal(fs.readFileSync(path.join(dst, "unchanged", "SKILL.md"), "utf8"), "unchanged new");
    assert.ok(lines.includes("  kept customized: customized locally; rerun with --force-skills to replace it"));
    const lock = JSON.parse(fs.readFileSync(path.join(dst, ".batuta-skills-lock.json"), "utf8"));
    assert.equal(lock.hashes.customized, previousHashes.customized, "the old managed hash is carried forward");
    assert.equal(lock.hashes.unchanged, treeHash(path.join(src, "unchanged")));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

for (const kind of ["directory", "dangling", "file"]) {
  test(`installSharedSkills preserves a locally added ${kind} symlink with a warning`, () => {
    const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
    const { installSharedSkills } = require("../bin/install.js");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-skills-symlink-"));
    const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
    try {
      fs.mkdirSync(path.join(src, "batuta"), { recursive: true });
      fs.writeFileSync(path.join(src, "batuta", "SKILL.md"), "old");
      fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v1" }));
      quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
      const target = path.join(tmp, "link-target");
      if (kind === "directory") fs.mkdirSync(target);
      if (kind === "file") fs.writeFileSync(target, "user file");
      const link = path.join(dst, "batuta", "local-link");
      fs.symlinkSync(target, link);
      fs.writeFileSync(path.join(src, "batuta", "SKILL.md"), "new");

      const { lines } = quiet(() => installSharedSkills(false, { src, dst, lockSrc }));

      assert.ok(fs.lstatSync(link).isSymbolicLink());
      assert.equal(fs.readlinkSync(link), target);
      assert.equal(fs.readFileSync(path.join(dst, "batuta", "SKILL.md"), "utf8"), "old");
      assert.ok(lines.includes("  kept batuta: customized locally; rerun with --force-skills to replace it"));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
}

test("--force-skills replaces a customized skill and a customized dropped skill is otherwise kept", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { installSharedSkills, treeHash } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-skills-force-"));
  const src = path.join(tmp, "src"), dst = path.join(tmp, "dst"), lockSrc = path.join(tmp, "skills-lock.json");
  try {
    fs.mkdirSync(path.join(src, "current"), { recursive: true });
    fs.mkdirSync(path.join(dst, "current"), { recursive: true });
    fs.mkdirSync(path.join(dst, "dropped"), { recursive: true });
    fs.writeFileSync(path.join(src, "current", "SKILL.md"), "release new");
    fs.writeFileSync(path.join(dst, "current", "SKILL.md"), "release old");
    fs.writeFileSync(path.join(dst, "dropped", "SKILL.md"), "release dropped");
    fs.writeFileSync(lockSrc, JSON.stringify({ ref: "v2" }));
    const previousHashes = { current: treeHash(path.join(dst, "current")), dropped: treeHash(path.join(dst, "dropped")) };
    fs.writeFileSync(path.join(dst, "current", "SKILL.md"), "local current");
    fs.writeFileSync(path.join(dst, "dropped", "SKILL.md"), "local dropped");
    fs.writeFileSync(path.join(dst, ".batuta-skills-lock.json"), JSON.stringify({ ref: "v1", skills: ["current", "dropped"], hashes: previousHashes }));

    quiet(() => installSharedSkills(false, { src, dst, lockSrc }));
    assert.equal(fs.readFileSync(path.join(dst, "current", "SKILL.md"), "utf8"), "local current");
    assert.equal(fs.readFileSync(path.join(dst, "dropped", "SKILL.md"), "utf8"), "local dropped");
    let lock = JSON.parse(fs.readFileSync(path.join(dst, ".batuta-skills-lock.json"), "utf8"));
    assert.deepEqual(lock.skills, ["current", "dropped"]);
    assert.equal(lock.hashes.dropped, previousHashes.dropped);

    let afterPaths;
    const forceHost = host("force", [], (dryRun, paths) => {
      afterPaths = paths;
      installSharedSkills(dryRun, { src, dst, lockSrc, ...paths });
    });
    const { code } = await quietAsync(() => main(["--no-core", "--force-skills"], { ...noShadow, hosts: [forceHost], run: () => {} }));
    assert.equal(code, 0);
    assert.deepEqual(afterPaths, { force: true });
    assert.equal(fs.readFileSync(path.join(dst, "current", "SKILL.md"), "utf8"), "release new");
    assert.ok(!fs.existsSync(path.join(dst, "dropped")), "force retires a customized dropped skill");
    lock = JSON.parse(fs.readFileSync(path.join(dst, ".batuta-skills-lock.json"), "utf8"));
    assert.deepEqual(lock.skills, ["current"]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
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
  assert.equal(coreAsset("freebsd", "x64"), null);

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
  const pins = { "batuta_linux_amd64.tar.gz": sha, "batuta_darwin_arm64.tar.gz": "0".repeat(64) };
  const target = await downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", checksums: pins });
  assert.equal(target, path.join(binDir, "batuta"));
  assert.equal(fs.readFileSync(target, "utf8"), "#!/bin/sh\necho v-test\n");
  assert.ok(fs.statSync(target).mode & 0o100, "binary is executable");
  assert.deepEqual(fetched, ["https://example.test/rel/checksums.txt", "https://example.test/rel/batuta_linux_amd64.tar.gz"]);

  // A tampered archive never reaches binDir.
  served["batuta_linux_amd64.tar.gz"] = Buffer.concat([bytes, Buffer.from("x")]);
  fs.writeFileSync(target, "previous");
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", checksums: pins }), /checksum mismatch/);
  assert.equal(fs.readFileSync(target, "utf8"), "previous");
  // Darwin/arm64 is listed with a bogus hash; a 404 on the archive is reported as such.
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "darwin", arch: "arm64", baseUrl: "https://example.test/rel", checksums: pins }), /HTTP 404/);
});

test("windows x64 downloads the zip, extracts batuta.exe with tar, and installs batuta.exe", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const crypto = require("node:crypto");
  const { downloadCore, coreAsset, coreBinaryName } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-windows-"));
  const binDir = path.join(tmp, "bin");
  const asset = "batuta_windows_amd64.zip";
  const bytes = Buffer.from("zip bytes");
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const fetched = [];
  const fetch = async (url) => {
    fetched.push(url);
    return new Response(url.endsWith("checksums.txt") ? `${sha}  ${asset}\n` : bytes, { status: 200 });
  };
  const exec = (command, args) => {
    assert.equal(command, "tar");
    assert.deepEqual(args.slice(0, 2), ["-xf", path.join(args[3], asset)]);
    assert.deepEqual(args.slice(2), ["-C", args[3], "batuta.exe"]);
    fs.writeFileSync(path.join(args[3], "batuta.exe"), "windows binary");
    return { status: 0 };
  };
  try {
    assert.equal(coreAsset("win32", "x64"), asset);
    assert.equal(coreAsset("win32", "arm64"), null);
    assert.equal(coreBinaryName("win32"), "batuta.exe");
    const target = await downloadCore({ fetch, exec, binDir, platform: "win32", arch: "x64", baseUrl: "https://example.test/rel", checksums: { [asset]: sha } });
    assert.equal(target, path.join(binDir, "batuta.exe"));
    assert.equal(fs.readFileSync(target, "utf8"), "windows binary");
    assert.deepEqual(fetched, ["https://example.test/rel/checksums.txt", `https://example.test/rel/${asset}`]);
    const noTar = () => ({ status: null, error: new Error("spawnSync tar.exe ENOENT") });
    await assert.rejects(
      downloadCore({ fetch, exec: noTar, binDir, platform: "win32", arch: "x64", baseUrl: "https://example.test/rel", checksums: { [asset]: sha } }),
      /tar\.exe is required/,
    );
    await assert.rejects(
      downloadCore({ fetch, exec, binDir, platform: "freebsd", arch: "x64", baseUrl: "https://example.test/rel" }),
      /no prebuilt batuta.*https:\/\/github\.com\/batuta-ai\/core\/releases\/tag\//,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("fallback on win32 runs go install and probes batuta.exe", async () => {
  const os = require("node:os");
  const path = require("node:path");
  const fs = require("node:fs");
  const { installCore, CORE_VERSION } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-win-fallback-"));
  const binDir = path.join(tmp, "bin");
  const calls = [];
  const exec = (command, args, options) => {
    calls.push({ command, args, options });
    if (command === "go") return { status: 0, stdout: "" };
    if (command === path.join(binDir, "batuta.exe")) return { status: 0, stdout: `${CORE_VERSION}\n` };
    throw new Error(`unexpected command: ${command}`);
  };
  const which = (name) => name === "go" ? "C:\\Go\\bin\\go.exe" : "";
  const fetch = async () => new Response("missing", { status: 404 });
  try {
    const { lines } = await quietAsync(() => installCore(false, {
      fetch,
      exec,
      which,
      binDir,
      platform: "win32",
      arch: "x64",
      baseUrl: "https://example.test/rel",
    }));
    assert.deepEqual(calls.map(({ command, args }) => [command, args]), [
      ["go", ["install", `github.com/batuta-ai/core/cmd/batuta@${CORE_VERSION}`]],
      [path.join(binDir, "batuta.exe"), ["version"]],
    ]);
    assert.ok(lines.some((line) => line.includes(`installed batuta ${CORE_VERSION} at ${path.join(binDir, "batuta.exe")}`)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("downloadCore enforces the package pinned digest against checksums.txt and the archive", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { downloadCore, CORE_VERSION } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-pinned-digest-"));
  const asset = "batuta_linux_amd64.tar.gz";
  const base = { binDir: path.join(tmp, "bin"), platform: "linux", arch: "x64", baseUrl: "https://example.test/rel" };
  const pinned = "a".repeat(64);
  const listed = "b".repeat(64);
  let fetched = 0;
  try {
    await assert.rejects(
      downloadCore({ ...base, checksums: {}, fetch: async () => { fetched++; } }),
      new RegExp(`no pinned digest for ${asset} in this package`),
    );
    assert.equal(fetched, 0, "a missing package pin fails before any download");

    const disagreeingFetch = async () => new Response(`${listed}  ${asset}\n`, { status: 200 });
    await assert.rejects(
      downloadCore({ ...base, checksums: { [asset]: pinned }, fetch: disagreeingFetch }),
      new RegExp(`checksums\\.txt of ${CORE_VERSION} lists ${listed} for ${asset.replaceAll(".", "\\.")}, this package pins ${pinned}`),
    );

    const tamperedFetch = async (url) => url.endsWith("checksums.txt")
      ? new Response(`${pinned}  ${asset}\n`, { status: 200 })
      : new Response("tampered", { status: 200 });
    await assert.rejects(
      downloadCore({ ...base, checksums: { [asset]: pinned }, fetch: tamperedFetch }),
      /checksum mismatch/,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("downloadCore deadline aborts the checksums fetch and names the timeout", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { downloadCore } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-deadline-"));
  const binDir = path.join(tmp, "bin");
  // AbortSignal.timeout is unref'ed; keep the mocked request alive until it settles.
  const keepAlive = setInterval(() => {}, 1000);
  const signals = [];
  const fakeFetch = (_url, options) => new Promise((_resolve, reject) => {
    signals.push(options.signal);
    options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
  });
  try {
    await assert.rejects(
      downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", timeoutMs: 20, checksums: { "batuta_linux_amd64.tar.gz": "0".repeat(64) } }),
      /download of checksums\.txt timed out after 20 ms/,
    );
    assert.equal(signals.length, 1);
    assert.ok(signals[0] instanceof AbortSignal);
    assert.equal(signals[0].aborted, true);
  } finally {
    clearInterval(keepAlive);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("downloadCore archive deadline aborts the archive fetch and names the asset", async (t) => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const { downloadCore } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-archive-deadline-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const keepAlive = setInterval(() => {}, 1000);
  t.after(() => clearInterval(keepAlive));
  const asset = "batuta_linux_amd64.tar.gz", pinned = "0".repeat(64);
  const requests = [];
  const fakeFetch = (url, { signal }) => {
    requests.push({ url, signal });
    if (url.endsWith("checksums.txt")) return Promise.resolve(new Response(`${pinned}  ${asset}\n`));
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  };
  await assert.rejects(downloadCore({
    fetch: fakeFetch, binDir: path.join(tmp, "bin"), platform: "linux", arch: "x64",
    baseUrl: "https://example.test/rel", timeoutMs: 20, checksums: { [asset]: pinned },
  }), /download of batuta_linux_amd64\.tar\.gz timed out after 20 ms/);
  assert.deepEqual(requests.map(({ url }) => url), [
    "https://example.test/rel/checksums.txt", `https://example.test/rel/${asset}`,
  ]);
  assert.ok(requests[1].signal instanceof AbortSignal);
  assert.notEqual(requests[0].signal, requests[1].signal, "each fetch gets its own deadline");
  assert.equal(requests[1].signal.aborted, true);
});

test("downloadCore size cap rejects content-length before reading and a streaming body while reading", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const { downloadCore } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-size-cap-"));
  const binDir = path.join(tmp, "bin");
  const checksum = `${"0".repeat(64)}  batuta_linux_amd64.tar.gz\n`;
  const opts = { binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", maxBytes: 128, checksums: { "batuta_linux_amd64.tar.gz": "0".repeat(64) } };
  try {
    const declaredArchive = new Response(new Uint8Array([1]), { status: 200, headers: { "content-length": "129" } });
    const declaredFetch = async (url) => url.endsWith("checksums.txt")
      ? new Response(checksum, { status: 200 })
      : declaredArchive;
    await assert.rejects(downloadCore({ ...opts, fetch: declaredFetch }), /batuta_linux_amd64\.tar\.gz is 129 bytes, above the 128 limit/);
    assert.equal(declaredArchive.bodyUsed, true, "an oversized declared body is canceled");

    let pulls = 0, canceled = false;
    const streamedArchive = new Response(new ReadableStream({
      // One initial chunk plus two pulls crosses the cap; a third pull is remaining body.
      start(controller) { controller.enqueue(new Uint8Array(60)); },
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(60));
        if (pulls === 3) controller.close();
      },
      cancel() { canceled = true; },
    }, { highWaterMark: 0 }), { status: 200 });
    const streamedFetch = async (url) => url.endsWith("checksums.txt")
      ? new Response(checksum, { status: 200 })
      : streamedArchive;
    await assert.rejects(downloadCore({ ...opts, fetch: streamedFetch }), /batuta_linux_amd64\.tar\.gz is 180 bytes, above the 128 limit/);
    assert.equal(pulls, 2, "the third pull is never requested after cumulative bytes cross the cap");
    assert.equal(canceled, true, "the remaining body is canceled immediately at the cap");
    assert.ok(!fs.existsSync(path.join(binDir, "batuta")), "an oversized archive is never installed");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("downloadCore cancels bodies rejected for declared size or HTTP status", async () => {
  const { downloadCore } = require("../bin/install.js");
  for (const rejectCancel of [false, true]) {
    for (const status of [200, 404]) {
      let canceled = false;
      const body = new ReadableStream({
        cancel() {
          canceled = true;
          if (rejectCancel) throw new Error("cancel failed");
        },
      });
      const response = new Response(body, { status, headers: { "content-length": "129" } });
      await assert.rejects(downloadCore({
        fetch: async () => response,
        platform: "linux",
        arch: "x64",
        maxBytes: 128,
      }), status === 200 ? /above the 128 limit/ : /HTTP 404/);
      assert.equal(canceled, true, `status ${status} cancels its body`);
    }
  }
});

test("downloadCore leaves nothing behind after deadline, size cap, checksum mismatch, or tar failure", async () => {
  const fs = require("node:fs");
  const os = require("node:os");
  const path = require("node:path");
  const crypto = require("node:crypto");
  const { downloadCore } = require("../bin/install.js");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-cleanup-"));
  const keepAlive = setInterval(() => {}, 1000);
  const binDir = path.join(tmp, "bin");
  fs.mkdirSync(binDir);
  const asset = "batuta_linux_amd64.tar.gz";
  const base = { binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", checksums: { [asset]: "0".repeat(64) } };
  const assertClean = (tmpDir) => {
    assert.deepEqual(fs.readdirSync(tmpDir), [], "no download work directory remains");
    assert.deepEqual(fs.readdirSync(binDir).filter((name) => name.startsWith(".batuta.")), [], "no binary staging file remains");
  };
  try {
    const deadlineFetch = (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    });
    const deadlineRoot = fs.mkdtempSync(path.join(tmp, "deadline-"));
    await assert.rejects(downloadCore({ ...base, tmpDir: deadlineRoot, fetch: deadlineFetch, timeoutMs: 20 }), /timed out after 20 ms/);
    assertClean(deadlineRoot);

    const sizeFetch = async () => new Response(new Uint8Array(1), { status: 200, headers: { "content-length": "129" } });
    const sizeRoot = fs.mkdtempSync(path.join(tmp, "size-"));
    await assert.rejects(downloadCore({ ...base, tmpDir: sizeRoot, fetch: sizeFetch, maxBytes: 128 }), /above the 128 limit/);
    assertClean(sizeRoot);

    const checksum = `${"0".repeat(64)}  ${asset}\n`;
    const mismatchFetch = async (url) => url.endsWith("checksums.txt")
      ? new Response(checksum, { status: 200 })
      : new Response(new Uint8Array([1]), { status: 200 });
    const mismatchRoot = fs.mkdtempSync(path.join(tmp, "mismatch-"));
    await assert.rejects(downloadCore({ ...base, tmpDir: mismatchRoot, fetch: mismatchFetch }), /checksum mismatch/);
    assertClean(mismatchRoot);

    const archive = new Uint8Array([1, 2, 3]);
    const sha = crypto.createHash("sha256").update(archive).digest("hex");
    const tarFetch = async (url) => url.endsWith("checksums.txt")
      ? new Response(`${sha}  ${asset}\n`, { status: 200 })
      : new Response(archive, { status: 200 });
    const tarRoot = fs.mkdtempSync(path.join(tmp, "tar-"));
    const failTar = (_command, args) => {
      assert.equal(path.dirname(args[3]), tarRoot, "download work uses the injected root");
      return { status: 2, stderr: "broken archive" };
    };
    await assert.rejects(downloadCore({ ...base, tmpDir: tarRoot, fetch: tarFetch, exec: failTar, checksums: { [asset]: sha } }), /tar failed: broken archive/);
    assertClean(tarRoot);
  } finally {
    clearInterval(keepAlive);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
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
  const pins = { "batuta_linux_amd64.tar.gz": sha };
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", checksums: pins }), /regular file named batuta/);
  assert.ok(!fs.existsSync(path.join(binDir, "batuta")));
  // Missing tar is reported as such, not as an empty "tar failed".
  const noTar = () => ({ status: null, error: new Error("spawnSync tar ENOENT") });
  await assert.rejects(downloadCore({ fetch: fakeFetch, binDir, platform: "linux", arch: "x64", baseUrl: "https://example.test/rel", exec: noTar, checksums: pins }), /tar is required/);
});

test("pruneSkillLinks removes only symlinks that resolve to the shared skill of the same name", () => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const { pruneSkillLinks } = require("../bin/install.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-prune-"));
  const src = path.join(root, "vendored"), shared = path.join(root, "agents-skills"), dir = path.join(root, "host-skills");
  for (const name of ["batuta", "batuta-init"]) {
    fs.mkdirSync(path.join(src, name), { recursive: true });
    fs.mkdirSync(path.join(shared, name), { recursive: true });
  }
  fs.mkdirSync(path.join(shared, "other"), { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.symlinkSync(path.join(shared, "batuta"), path.join(dir, "batuta"));            // duplicate: removed
  fs.mkdirSync(path.join(dir, "batuta-init"));                                        // real directory: kept
  fs.symlinkSync(path.join(shared, "other"), path.join(dir, "batuta-loop"));         // wrong target: kept
  fs.symlinkSync(path.join(shared, "batuta"), path.join(dir, "mine"));               // name not vendored: kept
  const dry = quiet(() => pruneSkillLinks(true, { dir, shared, src }));
  assert.deepEqual(dry.code, ["batuta"]);
  assert.ok(fs.lstatSync(path.join(dir, "batuta")).isSymbolicLink(), "dry run removes nothing");
  const { code, lines } = quiet(() => pruneSkillLinks(false, { dir, shared, src }));
  assert.deepEqual(code, ["batuta"]);
  assert.ok(!fs.existsSync(path.join(dir, "batuta")));
  assert.ok(fs.statSync(path.join(dir, "batuta-init")).isDirectory());
  assert.ok(fs.lstatSync(path.join(dir, "batuta-loop")).isSymbolicLink());
  assert.ok(fs.lstatSync(path.join(dir, "mine")).isSymbolicLink());
  assert.ok(fs.existsSync(path.join(shared, "batuta")), "the shared skill itself is untouched");
  assert.match(lines.join("\n"), /removed 1 duplicate skill link/);
  assert.deepEqual(quiet(() => pruneSkillLinks(false, { dir: path.join(root, "absent"), shared, src })).code, []);
});

test("shadowSharedSkillsInCodex disables the shared copies once, only when the plugin is installed", () => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const { shadowSharedSkillsInCodex } = require("../bin/install.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-shadow-"));
  const src = path.join(root, "vendored"), shared = path.join(root, "agents-skills");
  const config = path.join(root, "codex", "config.toml"), pluginCache = path.join(root, "plugin-cache");
  for (const name of ["batuta", "batuta-init", "batuta-plan"]) fs.mkdirSync(path.join(src, name), { recursive: true });
  for (const name of ["batuta", "batuta-init"]) {
    fs.mkdirSync(path.join(shared, name), { recursive: true });
    fs.writeFileSync(path.join(shared, name, "SKILL.md"), "---\nname: x\n---\n");
  }
  fs.mkdirSync(path.join(shared, "other"), { recursive: true });
  fs.writeFileSync(path.join(shared, "other", "SKILL.md"), "");
  const opts = { src, shared, config, pluginCache };
  assert.deepEqual(quiet(() => shadowSharedSkillsInCodex(false, opts)).code, [], "no plugin: nothing written");
  assert.ok(!fs.existsSync(config));
  fs.mkdirSync(pluginCache, { recursive: true });
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, 'model = "gpt-6-astra"');
  assert.deepEqual(quiet(() => shadowSharedSkillsInCodex(true, opts)).code, ["batuta", "batuta-init"]);
  assert.equal(fs.readFileSync(config, "utf8"), 'model = "gpt-6-astra"', "dry run writes nothing");
  const { code, lines } = quiet(() => shadowSharedSkillsInCodex(false, opts));
  assert.deepEqual(code, ["batuta", "batuta-init"]);
  const toml = fs.readFileSync(config, "utf8");
  assert.equal((toml.match(/\[\[skills\.config\]\]/g) || []).length, 2);
  assert.match(toml, new RegExp(`path = "${path.join(shared, "batuta-init", "SKILL.md").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\nenabled = false`));
  assert.ok(!toml.includes("other"), "unvendored skills are left alone");
  assert.ok(!toml.includes("batuta-plan"), "a vendored skill absent from the shared directory gets no entry");
  assert.match(toml, /^model = "gpt-6-astra"\n/, "existing config kept, newline inserted");
  assert.match(lines.join("\n"), /disabled 2 shared skills/);
  assert.deepEqual(quiet(() => shadowSharedSkillsInCodex(false, opts)).code, [], "second run adds nothing");
  assert.equal(fs.readFileSync(config, "utf8"), toml);
});
