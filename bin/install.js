#!/usr/bin/env node
// Batuta installer: one command, every AI coding agent on this machine.
//
//   npx -y github:batuta-ai/batuta            install for every detected host
//   npx -y github:batuta-ai/batuta -- --list  show the host matrix
//   npx -y github:batuta-ai/batuta -- --only codex --dry-run
//
// Each host gets its native install path; the Batuta skills reach any other
// agent through `npx skills add batuta-ai/skills`. The `batuta` binary
// (gates, inventory, unattended loop) is installed with `go install` when
// Go is available and skipped otherwise, loudly.

"use strict";
const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const REPO = "batuta-ai/batuta";
const SKILLS = "batuta-ai/skills";
const CORE = "github.com/batuta-ai/core/cmd/batuta@latest";
const ROOT = path.resolve(__dirname, "..");

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
      "claude plugin install batuta@batuta",
    ],
    note: "plugin: skills, /batuta:* commands and the SessionStart hook",
  },
  {
    id: "codex",
    label: "Codex CLI",
    detect: () => which("codex") || exists(path.join(home, ".codex")),
    steps: [
      `codex plugin marketplace add ${REPO}`,
      "codex plugin add batuta",
    ],
    note: "plugin: skills with $batuta-* prompts",
  },
  {
    id: "cursor",
    label: "Cursor",
    detect: () => which("cursor-agent") || exists(path.join(home, ".cursor")),
    steps: [`npx -y skills add ${SKILLS} -a cursor -g -y`],
    note: "skills in ~/.cursor/skills",
  },
  {
    id: "opencode",
    label: "opencode",
    detect: () => which("opencode") || exists(path.join(home, ".config", "opencode")),
    steps: [`npx -y skills add ${SKILLS} -a opencode -g -y`],
    after: installOpencodeCommands,
    note: "skills in ~/.config/opencode/skills plus /batuta-* commands",
  },
  {
    id: "agy",
    label: "Antigravity CLI",
    detect: () => which("agy"),
    steps: [`npx -y skills add ${SKILLS} -g -y`],
    note: "skills in ~/.agents/skills (agy reads the shared agents directory)",
  },
];

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

function installCore(dryRun) {
  const found = which("batuta");
  if (found) {
    const probe = spawnSync(found, ["version"], { encoding: "utf8" });
    if (probe.status === 0) { console.log(`core: batuta ${probe.stdout.trim()} already on PATH (${found})`); return; }
    console.log(`core: a different "batuta" is on PATH (${found}) — probably the archived batuta-cli. Remove it (cargo uninstall batuta) so the core binary wins.`);
  }
  if (!which("go")) {
    console.log("core: Go not found — skipping the batuta binary. Install Go and run:\n  go install " + CORE);
    return;
  }
  console.log(`core: go install ${CORE}`);
  if (!dryRun) run(`go install ${CORE}`);
}

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function main(argv) {
  const dryRun = argv.includes("--dry-run");
  const list = argv.includes("--list");
  const onlyIdx = argv.indexOf("--only");
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : "";
  const all = argv.includes("--all");
  const withCore = !argv.includes("--no-core");

  if (list) {
    for (const h of HOSTS) console.log(`${h.id.padEnd(9)} ${h.label.padEnd(16)} ${h.detect() ? "detected" : "-"}   ${h.note}`);
    return;
  }
  const targets = HOSTS.filter((h) => (only ? h.id === only : all || h.detect()));
  if (targets.length === 0) {
    console.log("No supported host detected. Any other agent: npx skills add " + SKILLS);
    return;
  }
  for (const h of targets) {
    console.log(`${h.label}:`);
    for (const step of h.steps) {
      if (dryRun) console.log(`  $ ${step}`); else {
        try { run(step); } catch (e) { console.log(`  failed: ${e.message}`); }
      }
    }
    if (h.after) h.after(dryRun);
  }
  if (withCore) installCore(dryRun);
  console.log("\nNext: open a project and run /batuta:init (Claude Code), $batuta-init (Codex) or /batuta-init (other hosts).");
}

main(process.argv.slice(2));
