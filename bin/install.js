#!/usr/bin/env node
// Batuta installer: one command, every AI coding agent on this machine.
//
//   npx -y github:batuta-ai/batuta            install for every detected host
//   npx -y github:batuta-ai/batuta -- --list  show the host matrix
//   npx -y github:batuta-ai/batuta -- --only codex --dry-run
//
// Claude Code and Codex get their plugin; Cursor, opencode and Antigravity
// read the shared ~/.agents/skills directory, which receives the skills
// vendored in this package (pinned by skills-lock.json). The `batuta` binary
// (gates, inventory, unattended loop) is downloaded from the pinned core
// release on GitHub, verified against checksums.txt; `go install` is only
// the fallback when the download fails and Go is available.

"use strict";
const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const REPO = "batuta-ai/batuta";
const SKILLS = "batuta-ai/skills";
// The core release this package was tested with. Bump deliberately: a
// batuta release names the binary it expects (see scripts/sync-skills.sh
// for the same idea with the skills).
const CORE_VERSION = "v1.1.0-beta.20";
const CORE_CHECKSUMS = {
  "batuta_darwin_amd64.tar.gz": "be8ef923041586ce380dab17f56d840d95f4c940468d894115d6d459302db207",
  "batuta_darwin_arm64.tar.gz": "03ff5783225a000ee89f9f9a55ee738e4295a4618158d043a0c8f993b8c8188e",
  "batuta_linux_amd64.tar.gz": "f582180fc6b030bd94ad77dd833aa8da178f75b97a53cd952bb1008d19a85a5c",
  "batuta_linux_arm64.tar.gz": "a7af84139570e3b0ca2ee76e5425f831e40a8c8060f466ff227ebb90a396552b",
  "batuta_windows_amd64.zip": "34de4761a87cdf3816aa9d031d0f96ecd71811af89acd63618476e01748d4e6c",
};
const CORE_MODULE = "github.com/batuta-ai/core/cmd/batuta";
const CORE_RELEASES = `https://github.com/batuta-ai/core/releases/download/${CORE_VERSION}`;
const crypto = require("node:crypto");
const ROOT = path.resolve(__dirname, "..");
const USAGE_LINES = [
  "Usage:",
  "  npx -y github:batuta-ai/batuta -- <flags>",
  "Flags:",
  "  --list         show the host matrix",
  "  --only <host>  install only the named host",
  "  --all          install every host, even if not detected",
  "  --dry-run      print the commands without running them",
  "  --force-skills replace locally customized shared skills",
  "  --no-core      skip installing the core batuta binary",
  "  --help, -h     print this usage and exit",
];

function printUsage(stream = console.log) {
  for (const line of USAGE_LINES) stream(line);
}

function which(bin) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [bin], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : "";
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

const home = os.homedir();
const HOSTS = [
  {
    id: "claude",
    label: "Claude Code",
    detect: () => which("claude") || exists(path.join(home, ".claude")),
    steps: [
      `claude plugin marketplace add ${REPO}`,
      "claude plugin marketplace update batuta",
      // `install` is a no-op on an installed plugin; `update` moves it to
      // the marketplace's current version and says "already latest" otherwise.
      "claude plugin install batuta@batuta",
      "claude plugin update batuta@batuta",
    ],
    after: (dryRun) => pruneSkillLinks(dryRun, { dir: path.join(home, ".claude", "skills") }),
    note: "plugin: skills, /batuta:* commands and the SessionStart hook",
  },
  {
    id: "codex",
    label: "Codex CLI",
    detect: () => which("codex") || exists(path.join(home, ".codex")),
    // `marketplace add` on a marketplace that already exists keeps the
    // revision it has; without the upgrade a re-run installs the version
    // the machine already had.
    steps: [
      `codex plugin marketplace add ${REPO}`,
      "codex plugin marketplace upgrade batuta",
      "codex plugin add batuta@batuta",
    ],
    after: (dryRun) => pruneSkillLinks(dryRun, { dir: path.join(home, ".codex", "skills") }),
    note: "plugin: skills with $batuta-* prompts",
  },
  {
    id: "cursor",
    label: "Cursor",
    detect: () => which("cursor-agent") || exists(path.join(home, ".cursor")),
    steps: [],
    after: installSharedSkills,
    note: "vendored skills copied to ~/.agents/skills",
  },
  {
    id: "opencode",
    label: "opencode",
    detect: () => which("opencode") || exists(path.join(home, ".config", "opencode")),
    steps: [],
    after: (dryRun, paths) => { installSharedSkills(dryRun, paths); installOpencodeCommands(dryRun); },
    note: "vendored skills copied to ~/.agents/skills plus /batuta-* commands",
  },
  {
    id: "agy",
    label: "Antigravity CLI",
    detect: () => which("agy"),
    steps: [],
    after: installSharedSkills,
    note: "vendored skills copied to ~/.agents/skills (the shared directory every host reads)",
  },
];

// Copies the vendored skills/ tree into the shared skills directory, one
// directory per skill, and records the pinned ref and the managed names in
// .batuta-skills-lock.json next to them. Each skill is staged beside its
// target and swapped in only once the copy succeeded, so a failure leaves
// the previous installation in place; skills the previous lock listed but
// this release no longer ships are removed. Runs once per invocation
// however many hosts share the directory — and only counts once it worked.
const LOCK_NAME = ".batuta-skills-lock.json";
let sharedSkillsDone = false;
function treeHash(dir) {
  const root = fs.lstatSync(dir);
  const entries = [];
  function record(current, relative, entry) {
    const type = entry.isSymbolicLink() ? "l" : entry.isDirectory() ? "d" : entry.isFile() ? "f" : "o";
    const payload = type === "l" ? fs.readlinkSync(current, { encoding: "buffer" })
      : type === "f" ? fs.readFileSync(current) : Buffer.alloc(0);
    entries.push([type, relative, payload]);
    if (type === "d") visit(current, relative);
  }
  function visit(current, relative) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true, encoding: "buffer" })) {
      const childRelative = relative.length ? Buffer.concat([relative, Buffer.from("/"), entry.name]) : entry.name;
      const child = Buffer.concat([Buffer.from(current), Buffer.from(path.sep), entry.name]);
      record(child, childRelative, entry);
    }
  }
  if (root.isDirectory()) visit(dir, Buffer.alloc(0));
  else record(dir, Buffer.alloc(0), root);
  const hash = crypto.createHash("sha256");
  // Type tags and byte lengths distinguish both entry types and record boundaries.
  for (const [type, relative, payload] of entries.sort((a, b) => Buffer.compare(a[1], b[1]))) {
    hash.update(type);
    for (const bytes of [relative, payload]) {
      hash.update(`${bytes.length}:`);
      hash.update(bytes);
    }
  }
  return hash.digest("hex");
}

function installSharedSkills(dryRun, paths = {}) {
  const src = paths.src || path.join(ROOT, "skills");
  const dst = paths.dst || path.join(home, ".agents", "skills");
  const lockSrc = paths.lockSrc || path.join(ROOT, "skills-lock.json");
  const copy = paths.copy || ((from, to) => fs.cpSync(from, to, { recursive: true }));
  if (!paths.src && sharedSkillsDone) return;
  const names = fs.readdirSync(src).filter((n) => fs.statSync(path.join(src, n)).isDirectory());
  if (dryRun) { console.log(`  copy ${src}/{${names.join(",")}} -> ${dst}/`); return; }
  const lock = JSON.parse(fs.readFileSync(lockSrc, "utf8"));
  fs.mkdirSync(dst, { recursive: true });
  let previousLock = {};
  try { previousLock = JSON.parse(fs.readFileSync(path.join(dst, LOCK_NAME), "utf8")); } catch { /* first install */ }
  const previous = previousLock.skills || [];
  const previousHashes = previousLock.hashes || {};
  const hashes = {};
  const skillName = /^[a-z][a-z0-9-]*$/;
  for (const name of names) {
    if (!skillName.test(name)) throw new Error(`vendored skill name "${name}" is not a skill directory name`);
  }
  const staged = [];
  try {
    for (const name of names) {
      const target = path.join(dst, name);
      const previousHash = previousHashes[name];
      const entry = fs.lstatSync(target, { throwIfNoEntry: false });
      if (!paths.force && previousHash && entry && treeHash(target) !== previousHash) {
        hashes[name] = previousHash;
        console.log(`  kept ${name}: customized locally; rerun with --force-skills to replace it`);
        continue;
      }
      const stage = path.join(dst, `.${name}.staging`);
      fs.rmSync(stage, { recursive: true, force: true });
      staged.push([stage, target]);
      copy(path.join(src, name), stage);
      hashes[name] = treeHash(path.join(src, name));
    }
  } catch (e) {
    for (const [stage] of staged) fs.rmSync(stage, { recursive: true, force: true });
    throw e;
  }
  for (const [stage, target] of staged) {
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(stage, target);
  }
  const retained = [];
  for (const name of previous) {
    // Names come from a file on disk: only plain skill directory names are ever removed.
    if (!skillName.test(name) || names.includes(name)) continue;
    const target = path.join(dst, name);
    const previousHash = previousHashes[name];
    const entry = fs.lstatSync(target, { throwIfNoEntry: false });
    if (!paths.force && previousHash && entry && treeHash(target) !== previousHash) {
      retained.push(name);
      hashes[name] = previousHash;
      console.log(`  kept ${name}: customized locally; rerun with --force-skills to replace it`);
    } else {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
  lock.skills = names.concat(retained);
  lock.hashes = hashes;
  lock.installedAt = new Date().toISOString();
  fs.writeFileSync(path.join(dst, LOCK_NAME), JSON.stringify(lock, null, 2) + "\n");
  sharedSkillsDone = !paths.src;
  console.log(`  copied ${names.length} skills to ${dst} (${lock.ref})`);
}

// A plugin host lists every skill the plugin ships. `npx skills add
// batuta-ai/skills -g` without `-a` also symlinks each skill from
// ~/.agents/skills into that host's user skills directory, so the host shows
// every Batuta skill twice (`/batuta:init` and `/batuta-init`). Once the
// plugin is installed those links are removed. Only symlinks, only the names
// this package vendors, only when the link resolves inside the shared
// directory: a real directory or a link to anywhere else is the user's.
function pruneSkillLinks(dryRun, paths = {}) {
  const dir = paths.dir;
  const shared = path.resolve(paths.shared || path.join(home, ".agents", "skills"));
  const src = paths.src || path.join(ROOT, "skills");
  let names;
  try { names = fs.readdirSync(src).filter((n) => fs.statSync(path.join(src, n)).isDirectory()); } catch { return []; }
  const pruned = [];
  for (const name of names) {
    const link = path.join(dir, name);
    let stat;
    try { stat = fs.lstatSync(link); } catch { continue; }
    if (!stat.isSymbolicLink()) continue;
    let target;
    try { target = fs.realpathSync(link); } catch { continue; }
    if (target !== path.join(fs.realpathSync(shared), name)) continue;
    if (!dryRun) fs.unlinkSync(link);
    pruned.push(name);
  }
  if (pruned.length > 0) {
    console.log(`  ${dryRun ? "would remove" : "removed"} ${pruned.length} duplicate skill links from ${dir} (the plugin already ships them)`);
  }
  return pruned;
}

// Codex reads ~/.agents/skills natively, so on a machine where the Codex
// plugin and a shared-directory host (Cursor, opencode, agy) coexist it lists
// every Batuta skill twice: `batuta-init` from the shared directory and
// `batuta:batuta-init` from the plugin. The plugin stays the source on Codex;
// the shared copies are switched off through `[[skills.config]]` entries
// (path selector, enabled = false) appended to ~/.codex/config.toml. Only the
// names this package vendors, only paths that exist, one entry per path.
function shadowSharedSkillsInCodex(dryRun, paths = {}) {
  const shared = paths.shared || path.join(home, ".agents", "skills");
  const config = paths.config || path.join(home, ".codex", "config.toml");
  const pluginCache = paths.pluginCache || path.join(home, ".codex", "plugins", "cache", "batuta", "batuta");
  const src = paths.src || path.join(ROOT, "skills");
  if (!exists(pluginCache)) return [];
  let names;
  try { names = fs.readdirSync(src).filter((n) => fs.statSync(path.join(src, n)).isDirectory()); } catch { return []; }
  let current = "";
  try { current = fs.readFileSync(config, "utf8"); } catch { /* no config yet */ }
  const added = [];
  let block = "";
  for (const name of names) {
    const skillMd = path.join(shared, name, "SKILL.md");
    if (!exists(skillMd)) continue;
    if (current.includes(`path = ${JSON.stringify(skillMd)}`)) continue;
    block += `\n[[skills.config]]\npath = ${JSON.stringify(skillMd)}\nenabled = false\n`;
    added.push(name);
  }
  if (added.length === 0) return [];
  if (dryRun) { console.log(`  would disable ${added.length} shared skills in ${config} (the plugin already ships them)`); return added; }
  fs.mkdirSync(path.dirname(config), { recursive: true });
  const sep = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
  fs.appendFileSync(config, sep + block);
  console.log(`  disabled ${added.length} shared skills in ${config} (the plugin already ships them)`);
  return added;
}

function installOpencodeCommands(dryRun) {
  const src = path.join(ROOT, "hosts", "opencode", "commands");
  const dst = path.join(home, ".config", "opencode", "commands");
  if (dryRun) { console.log(`  copy ${src}/*.md -> ${dst}/`); return; }
  fs.mkdirSync(dst, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dst, file));
  }
  console.log(`  copied ${fs.readdirSync(src).length} commands to ${dst}`);
}

// The release archive for this machine, or null when no archive is built
// for it (the installer then says what to do by hand).
function coreAsset(platform = process.platform, arch = process.arch) {
  if (platform === "win32") return arch === "x64" ? "batuta_windows_amd64.zip" : null;
  const os = { darwin: "darwin", linux: "linux" }[platform];
  const cpu = { x64: "amd64", arm64: "arm64" }[arch];
  if (!os || !cpu) return null;
  return `batuta_${os}_${cpu}.tar.gz`;
}

function coreBinaryName(platform = process.platform) {
  return platform === "win32" ? "batuta.exe" : "batuta";
}

// The sha256 listed for `name` in a goreleaser checksums.txt.
function expectedChecksum(checksums, name) {
  for (const line of checksums.split(/\r?\n/)) {
    const [hash, file] = line.trim().split(/\s+/);
    if (file === name && /^[0-9a-f]{64}$/.test(hash)) return hash;
  }
  return null;
}

async function readDownloadBody(response, name, maxBytes) {
  const declared = Number(response.headers && response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    try { await response.body?.cancel(); } catch { /* preserve the size error */ }
    throw new Error(`${name} is ${declared} bytes, above the ${maxBytes} limit`);
  }
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) throw new Error(`${name} is ${bytes.length} bytes, above the ${maxBytes} limit`);
    return bytes;
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    const bytes = Buffer.from(chunk);
    total += bytes.length;
    if (total > maxBytes) throw new Error(`${name} is ${total} bytes, above the ${maxBytes} limit`);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, total);
}

// Downloads the pinned core release for this machine, verifies it against
// checksums.txt and extracts the platform binary into binDir. Returns the installed
// path. `deps` exist for the tests: fetch, exec and the bin/temp directories.
async function downloadCore(deps = {}) {
  const fetcher = deps.fetch || fetch;
  const exec = deps.exec || ((cmd, args) => spawnSync(cmd, args, { encoding: "utf8" }));
  const binDir = deps.binDir || process.env.BATUTA_BIN_DIR || path.join(home, ".local", "bin");
  const timeoutMs = deps.timeoutMs === undefined ? 60000 : deps.timeoutMs;
  const maxBytes = deps.maxBytes === undefined ? 64 * 1024 * 1024 : deps.maxBytes;
  const platform = deps.platform || process.platform;
  const asset = coreAsset(deps.platform, deps.arch);
  if (!asset) throw new Error(`no prebuilt batuta for ${deps.platform || process.platform}/${deps.arch || process.arch}; see https://github.com/batuta-ai/core/releases/tag/${CORE_VERSION}`);
  const pinned = (deps.checksums || CORE_CHECKSUMS)[asset];
  if (!pinned) throw new Error(`no pinned digest for ${asset} in this package`);
  const get = async (name) => {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const response = await fetcher(`${(deps.baseUrl || CORE_RELEASES)}/${name}`, { signal });
      if (!response.ok) {
        try { await response.body?.cancel(); } catch { /* preserve the HTTP error */ }
        throw new Error(`download of ${name} failed: HTTP ${response.status}`);
      }
      return await readDownloadBody(response, name, maxBytes);
    } catch (e) {
      if (signal.aborted) throw new Error(`download of ${name} timed out after ${timeoutMs} ms`);
      throw e;
    }
  };
  const checksums = (await get("checksums.txt")).toString("utf8");
  const listed = expectedChecksum(checksums, asset);
  if (listed !== pinned) throw new Error(`checksums.txt of ${CORE_VERSION} lists ${listed} for ${asset}, this package pins ${pinned}`);
  const archive = await get(asset);
  const got = crypto.createHash("sha256").update(archive).digest("hex");
  if (got !== pinned) throw new Error(`${asset} checksum mismatch: expected ${pinned}, got ${got}`);
  const work = fs.mkdtempSync(path.join(deps.tmpDir || os.tmpdir(), "batuta-core-"));
  try {
    const archivePath = path.join(work, asset);
    fs.writeFileSync(archivePath, archive);
    const binaryName = coreBinaryName(platform);
    const untar = exec("tar", ["-xf", archivePath, "-C", work, binaryName]);
    if (untar.error) throw new Error(`${platform === "win32" ? "tar.exe" : "tar"} is required to extract ${asset}: ${untar.error.message}`);
    if (untar.status !== 0) throw new Error(`tar failed: ${(untar.stderr || "").trim()}`);
    const extracted = path.join(work, binaryName);
    const member = fs.lstatSync(extracted, { throwIfNoEntry: false });
    if (!member || !member.isFile()) throw new Error(`${asset} does not contain a regular file named ${binaryName}`);
    fs.mkdirSync(binDir, { recursive: true });
    return installBinary(fs.readFileSync(extracted), binDir, binaryName);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// Writes the binary through a fresh exclusive staging file in binDir and
// renames it over the requested name, so a pre-existing path (a symlink left by
// someone else, say) is never followed and a failure leaves no stub.
function installBinary(bytes, binDir, name = coreBinaryName()) {
  const target = path.join(binDir, name);
  const stage = path.join(binDir, `.${name}.${process.pid}.${crypto.randomBytes(6).toString("hex")}`);
  const fd = fs.openSync(stage, "wx", 0o755);
  try {
    fs.writeSync(fd, bytes);
    fs.closeSync(fd);
    fs.renameSync(stage, target);
  } catch (e) {
    try { fs.closeSync(fd); } catch { /* already closed */ }
    fs.rmSync(stage, { force: true });
    throw e;
  }
  return target;
}

// After either install path: is the binary we installed the one PATH finds?
function reportCorePath(target, find = which) {
  const onPath = find(path.basename(target));
  if (onPath && path.resolve(onPath) !== path.resolve(target)) console.log(`core: note — ${onPath} comes first on PATH; put ${path.dirname(target)} before it.`);
  else if (!onPath) console.log(`core: add ${path.dirname(target)} to PATH.`);
}

async function installCore(dryRun, deps = {}) {
  const platform = deps.platform || process.platform;
  const arch = deps.arch || process.arch;
  const binaryName = coreBinaryName(platform);
  const find = deps.which || which;
  const exec = deps.exec || ((cmd, args, options) => spawnSync(cmd, args, options));
  const found = find(binaryName);
  let foundVersion = "";
  if (found) {
    const probe = exec(found, ["version"], { encoding: "utf8" });
    if (probe.status === 0) foundVersion = probe.stdout.trim();
    else console.log(`core: a different "batuta" is on PATH (${found}) — probably the archived batuta-cli. Remove it (cargo uninstall batuta) so the core binary wins.`);
  }
  if (foundVersion === CORE_VERSION) { console.log(`core: batuta ${foundVersion} already on PATH (${found})`); return; }
  if (foundVersion) console.log(`core: batuta ${foundVersion} on PATH (${found}); this release expects ${CORE_VERSION}`);
  const asset = coreAsset(platform, arch);
  if (dryRun) { console.log(`core: download ${CORE_RELEASES}/${asset || "(no prebuilt binary for this platform)"}`); return; }
  const binDir = deps.binDir || process.env.BATUTA_BIN_DIR || path.join(home, ".local", "bin");
  try {
    const target = await downloadCore({ ...deps, binDir, platform, arch });
    console.log(`core: installed batuta ${CORE_VERSION} at ${target}`);
    reportCorePath(target, find);
    return;
  } catch (e) {
    console.log(`core: ${e.message}`);
  }
  if (!find("go")) throw new Error(`core binary not installed; download failed and Go is not available. Manual: https://github.com/batuta-ai/core/releases/tag/${CORE_VERSION}`);
  // Same destination contract as the download: GOBIN puts the binary in binDir.
  console.log(`core: falling back to go install ${CORE_MODULE}@${CORE_VERSION} (GOBIN=${binDir})`);
  fs.mkdirSync(binDir, { recursive: true });
  console.log(`  $ GOBIN=${binDir} go install ${CORE_MODULE}@${CORE_VERSION}`);
  const installed = exec("go", ["install", `${CORE_MODULE}@${CORE_VERSION}`], { stdio: "inherit", env: { ...process.env, GOBIN: binDir } });
  if (installed.error) throw installed.error;
  if (installed.status !== 0) throw new Error(`go install failed with status ${installed.status}`);
  const target = path.join(binDir, binaryName);
  const probe = exec(target, ["version"], { encoding: "utf8" });
  if (probe.status !== 0 || probe.stdout.trim() !== CORE_VERSION) throw new Error(`go install did not produce batuta ${CORE_VERSION} at ${target}`);
  console.log(`core: installed batuta ${CORE_VERSION} at ${target}`);
  reportCorePath(target, find);
}

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

async function main(argv, deps = {}) {
  const exec = deps.run || run;
  const hosts = deps.hosts || HOSTS;
  let dryRun = false;
  let list = false;
  let only = "";
  let all = false;
  let forceSkills = false;
  let withCore = true;
  let help = false;
  let unknown = "";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--list") list = true;
    else if (arg === "--only") only = argv[++i] || "";
    else if (arg === "--all") all = true;
    else if (arg === "--force-skills") forceSkills = true;
    else if (arg === "--no-core") withCore = false;
    else if (arg === "--help" || arg === "-h") help = true;
    else if (arg.startsWith("--")) { unknown = arg; break; }
  }

  if (help) {
    printUsage();
    return 0;
  }
  if (unknown) {
    printUsage(console.error);
    console.error(`Unknown flag "${unknown}".`);
    return 2;
  }

  if (list) {
    for (const h of hosts) console.log(`${h.id.padEnd(9)} ${h.label.padEnd(16)} ${h.detect() ? "detected" : "-"}   ${h.note}`);
    return;
  }
  const targets = hosts.filter((h) => (only ? h.id === only : all || h.detect()));
  if (targets.length === 0) {
    if (only) { console.error(`Unknown host "${only}". Hosts: ${hosts.map((h) => h.id).join(", ")}`); return 2; }
    console.log("No supported host detected. Any other agent: npx skills add " + SKILLS + " -g -a <agent>");
    return 0;
  }
  const failed = [];
  for (const h of targets) {
    console.log(`${h.label}:`);
    let ok = true;
    for (const step of h.steps) {
      if (dryRun) { console.log(`  $ ${step}`); continue; }
      try { exec(step); } catch (e) { console.log(`  failed: ${e.message}`); ok = false; break; }
    }
    if (!ok) { failed.push(h.id); console.log(`  ${h.label} skipped: a step failed above`); continue; }
    if (h.after) {
      try { h.after(dryRun, { force: forceSkills }); } catch (e) { console.log(`  failed: ${e.message}`); failed.push(h.id); }
    }
  }
  try { (deps.shadowSharedSkillsInCodex || shadowSharedSkillsInCodex)(dryRun); } catch (e) { console.log(`  failed: ${e.message}`); failed.push("codex"); }
  if (withCore) {
    try { await (deps.installCore || installCore)(dryRun); } catch (e) { console.log(`  failed: ${e.message}`); failed.push("core"); }
  }
  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.join(", ")}. Fix the error above and re-run with --only <host>.`);
    return 1;
  }
  console.log("\nNext: open a project and run /batuta:init (Claude Code), $batuta-init (Codex) or /batuta-init (other hosts).");
  return 0;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
module.exports = { main, HOSTS, treeHash, installSharedSkills, pruneSkillLinks, shadowSharedSkillsInCodex, downloadCore, installBinary, installCore, coreAsset, coreBinaryName, expectedChecksum, CORE_VERSION, CORE_CHECKSUMS };
