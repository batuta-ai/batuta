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
const CORE_VERSION = "v1.1.0-beta.13";
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
    after: (dryRun) => { installSharedSkills(dryRun); installOpencodeCommands(dryRun); },
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
  let previous = [];
  try { previous = JSON.parse(fs.readFileSync(path.join(dst, LOCK_NAME), "utf8")).skills || []; } catch { /* first install */ }
  const skillName = /^[a-z][a-z0-9-]*$/;
  for (const name of names) {
    if (!skillName.test(name)) throw new Error(`vendored skill name "${name}" is not a skill directory name`);
  }
  const staged = [];
  try {
    for (const name of names) {
      const stage = path.join(dst, `.${name}.staging`);
      fs.rmSync(stage, { recursive: true, force: true });
      staged.push([stage, path.join(dst, name)]);
      copy(path.join(src, name), stage);
    }
  } catch (e) {
    for (const [stage] of staged) fs.rmSync(stage, { recursive: true, force: true });
    throw e;
  }
  for (const [stage, target] of staged) {
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(stage, target);
  }
  for (const name of previous) {
    // Names come from a file on disk: only plain skill directory names are ever removed.
    if (!skillName.test(name) || names.includes(name)) continue;
    fs.rmSync(path.join(dst, name), { recursive: true, force: true });
  }
  lock.skills = names;
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
  const os = { darwin: "darwin", linux: "linux" }[platform];
  const cpu = { x64: "amd64", arm64: "arm64" }[arch];
  if (!os || !cpu) return null;
  return `batuta_${os}_${cpu}.tar.gz`;
}

// The sha256 listed for `name` in a goreleaser checksums.txt.
function expectedChecksum(checksums, name) {
  for (const line of checksums.split(/\r?\n/)) {
    const [hash, file] = line.trim().split(/\s+/);
    if (file === name && /^[0-9a-f]{64}$/.test(hash)) return hash;
  }
  return null;
}

// Downloads the pinned core release for this machine, verifies it against
// checksums.txt and extracts `batuta` into binDir. Returns the installed
// path. `deps` exist for the tests: fetch, exec and the bin directory.
async function downloadCore(deps = {}) {
  const fetcher = deps.fetch || fetch;
  const exec = deps.exec || ((cmd, args) => spawnSync(cmd, args, { encoding: "utf8" }));
  const binDir = deps.binDir || process.env.BATUTA_BIN_DIR || path.join(home, ".local", "bin");
  const asset = coreAsset(deps.platform, deps.arch);
  if (!asset) throw new Error(`no prebuilt batuta for ${deps.platform || process.platform}/${deps.arch || process.arch}; see https://github.com/batuta-ai/core/releases/tag/${CORE_VERSION}`);
  const get = async (name) => {
    const response = await fetcher(`${(deps.baseUrl || CORE_RELEASES)}/${name}`);
    if (!response.ok) throw new Error(`download of ${name} failed: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  };
  const checksums = (await get("checksums.txt")).toString("utf8");
  const want = expectedChecksum(checksums, asset);
  if (!want) throw new Error(`${asset} is not listed in checksums.txt of ${CORE_VERSION}`);
  const archive = await get(asset);
  const got = crypto.createHash("sha256").update(archive).digest("hex");
  if (got !== want) throw new Error(`${asset} checksum mismatch: expected ${want}, got ${got}`);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-core-"));
  try {
    const archivePath = path.join(work, asset);
    fs.writeFileSync(archivePath, archive);
    const untar = exec("tar", ["-xzf", archivePath, "-C", work, "batuta"]);
    if (untar.error) throw new Error(`tar is required to extract ${asset}: ${untar.error.message}`);
    if (untar.status !== 0) throw new Error(`tar failed: ${(untar.stderr || "").trim()}`);
    const extracted = path.join(work, "batuta");
    const member = fs.lstatSync(extracted, { throwIfNoEntry: false });
    if (!member || !member.isFile()) throw new Error(`${asset} does not contain a regular file named batuta`);
    fs.mkdirSync(binDir, { recursive: true });
    return installBinary(fs.readFileSync(extracted), binDir);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

// Writes the binary through a fresh exclusive staging file in binDir and
// renames it over `batuta`, so a pre-existing path (a symlink left by
// someone else, say) is never followed and a failure leaves no stub.
function installBinary(bytes, binDir) {
  const target = path.join(binDir, "batuta");
  const stage = path.join(binDir, `.batuta.${process.pid}.${crypto.randomBytes(6).toString("hex")}`);
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
function reportCorePath(target) {
  const onPath = which("batuta");
  if (onPath && path.resolve(onPath) !== path.resolve(target)) console.log(`core: note — ${onPath} comes first on PATH; put ${path.dirname(target)} before it.`);
  else if (!onPath) console.log(`core: add ${path.dirname(target)} to PATH.`);
}

async function installCore(dryRun) {
  const found = which("batuta");
  let foundVersion = "";
  if (found) {
    const probe = spawnSync(found, ["version"], { encoding: "utf8" });
    if (probe.status === 0) foundVersion = probe.stdout.trim();
    else console.log(`core: a different "batuta" is on PATH (${found}) — probably the archived batuta-cli. Remove it (cargo uninstall batuta) so the core binary wins.`);
  }
  if (foundVersion === CORE_VERSION) { console.log(`core: batuta ${foundVersion} already on PATH (${found})`); return; }
  if (foundVersion) console.log(`core: batuta ${foundVersion} on PATH (${found}); this release expects ${CORE_VERSION}`);
  const asset = coreAsset();
  if (dryRun) { console.log(`core: download ${CORE_RELEASES}/${asset || "(no prebuilt binary for this platform)"}`); return; }
  const binDir = process.env.BATUTA_BIN_DIR || path.join(home, ".local", "bin");
  try {
    const target = await downloadCore({ binDir });
    console.log(`core: installed batuta ${CORE_VERSION} at ${target}`);
    reportCorePath(target);
    return;
  } catch (e) {
    console.log(`core: ${e.message}`);
  }
  if (!which("go")) throw new Error(`core binary not installed; download failed and Go is not available. Manual: https://github.com/batuta-ai/core/releases/tag/${CORE_VERSION}`);
  // Same destination contract as the download: GOBIN puts the binary in binDir.
  console.log(`core: falling back to go install ${CORE_MODULE}@${CORE_VERSION} (GOBIN=${binDir})`);
  fs.mkdirSync(binDir, { recursive: true });
  console.log(`  $ GOBIN=${binDir} go install ${CORE_MODULE}@${CORE_VERSION}`);
  execSync(`go install ${CORE_MODULE}@${CORE_VERSION}`, { stdio: "inherit", env: { ...process.env, GOBIN: binDir } });
  const target = path.join(binDir, "batuta");
  const probe = spawnSync(target, ["version"], { encoding: "utf8" });
  if (probe.status !== 0 || probe.stdout.trim() !== CORE_VERSION) throw new Error(`go install did not produce batuta ${CORE_VERSION} at ${target}`);
  console.log(`core: installed batuta ${CORE_VERSION} at ${target}`);
  reportCorePath(target);
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
  let withCore = true;
  let help = false;
  let unknown = "";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--list") list = true;
    else if (arg === "--only") only = argv[++i] || "";
    else if (arg === "--all") all = true;
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
      try { h.after(dryRun); } catch (e) { console.log(`  failed: ${e.message}`); failed.push(h.id); }
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
module.exports = { main, HOSTS, installSharedSkills, pruneSkillLinks, shadowSharedSkillsInCodex, downloadCore, installBinary, coreAsset, expectedChecksum, CORE_VERSION };
