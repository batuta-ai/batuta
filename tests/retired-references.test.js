const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const checkScript = path.join(__dirname, "check.sh");
const retired = {
  superpowers: ["superpowers", ".md"].join(""),
  codexPlugin: ["codex-plugin", ".md"].join(""),
  compozy: ["compozy", ".md"].join(""),
};

function write(root, name, contents) {
  const target = path.join(root, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function fixture(t, { git = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-retired-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of [
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".cursor-plugin/marketplace.json",
    ".agents/plugins/marketplace.json",
  ]) {
    write(root, name, '{"version":"1.0.0"}\n');
  }
  write(root, "hooks/hooks.json", "{}\n");
  write(root, "release-please-config.json", "{}\n");
  write(root, "scripts/check-commands.sh", "#!/usr/bin/env bash\nexit 0\n");
  write(root, "tests/smoke.test.js", 'require("node:test")("smoke", () => {});\n');
  fs.copyFileSync(checkScript, path.join(root, "tests/check.sh"));
  fs.mkdirSync(path.join(root, "skills"));
  refreshSkillsLock(root);
  write(root, ".gitignore", ".batuta/\nnode_modules/\n");

  if (git) {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
  }
  return root;
}

function runCheck(root) {
  return spawnSync("bash", ["tests/check.sh"], { cwd: root, encoding: "utf8" });
}

function refreshSkillsLock(root) {
  const hash = spawnSync(
    "bash",
    ["-c", "find . -type f | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256 | cut -c1-64"],
    { cwd: path.join(root, "skills"), encoding: "utf8" },
  ).stdout.trim();
  write(root, "skills-lock.json", JSON.stringify({ computedHash: `sha256:${hash}` }));
}

test("retired-reference scan ignores ignored content and retains history exemptions", (t) => {
  const root = fixture(t);
  write(root, ".batuta/worktrees/old/log.js", `${retired.codexPlugin}\n`);
  write(root, "node_modules/example/history.json", `"${retired.compozy}"\n`);
  write(root, "docs/history.md", `${retired.superpowers}\n`);
  write(root, "CHANGELOG.md", `${retired.codexPlugin}\n`);
  write(root, "skills/archive/note.md", `${retired.compozy}\n`);
  refreshSkillsLock(root);

  const result = runCheck(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /batuta check: ok/);
});

test("retired-reference scan checks tracked modifications and nonignored untracked files", (t) => {
  const root = fixture(t);
  write(root, "tracked file.js", "current integration\n");
  assert.equal(spawnSync("git", ["add", "tracked file.js"], { cwd: root }).status, 0);
  write(root, "tracked file.js", `${retired.superpowers}\n`);
  write(root, "untracked file.json", `"${retired.codexPlugin}"\n`);

  const result = runCheck(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, new RegExp(`tracked file\\.js:1:${retired.superpowers.replace(".", "\\.")}`));
  assert.match(result.stdout, new RegExp(`untracked file\\.json:1:"${retired.codexPlugin.replace(".", "\\.")}"`));
});

test("retired-reference scan succeeds with no matches and surfaces Git errors", (t) => {
  const clean = fixture(t);
  write(clean, "source.js", "still supported\n");
  let result = runCheck(clean);
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const notGit = fixture(t, { git: false });
  result = runCheck(notGit);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /retired integration scan failed/);
  assert.match(result.stdout + result.stderr, /not a git repository/i);
});
