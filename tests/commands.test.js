"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const validator = path.join(__dirname, "..", "scripts", "check-commands.sh");

function validate(commandName, skillName, createTarget = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "batuta-commands-"));
  fs.mkdirSync(path.join(root, "commands"), { recursive: true });
  fs.mkdirSync(path.join(root, "hosts", "opencode", "commands"), { recursive: true });
  if (createTarget) {
    fs.mkdirSync(path.join(root, "skills", skillName), { recursive: true });
    fs.writeFileSync(path.join(root, "skills", skillName, "SKILL.md"), "---\n");
  }
  const contents = `Load the \`${skillName}\` skill and preserve $ARGUMENTS.\n`;
  fs.writeFileSync(path.join(root, "commands", `${commandName}.md`), contents);
  fs.writeFileSync(
    path.join(root, "hosts", "opencode", "commands", `batuta-${commandName}.md`),
    contents,
  );
  const result = spawnSync("bash", [validator, root], { encoding: "utf8" });
  fs.rmSync(root, { recursive: true, force: true });
  return result;
}

test("command validation accepts multi-segment skill names", () => {
  const result = validate("qa-plan", "batuta-qa-plan");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("command validation keeps accepting single-suffix skill names", () => {
  const result = validate("review", "batuta-review");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("command validation rejects a missing skill target", () => {
  const result = validate("qa-run", "batuta-qa-run", false);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /does not route to an existing skill/);
});

test("command validation rejects malformed skill names", () => {
  for (const skillName of ["batuta-qa_plan", "batuta--qa", "batuta-QA"]) {
    const result = validate("malformed", skillName);
    assert.equal(result.status, 1, `${skillName}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /does not route to an existing skill/);
  }
});
