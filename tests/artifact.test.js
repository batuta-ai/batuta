const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const { validateArtifact } = require('../scripts/check-artifact.js');

const repoRoot = path.resolve(__dirname, '..');
const runtimePaths = [
  'package.json',
  'LICENSE',
  'README.md',
  'README.pt-BR.md',
  'bin/install.js',
  'commands',
  'hosts/opencode/commands',
  'hooks/hooks.json',
  'scripts/session-start.sh',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
  'skills-lock.json',
  'skills',
];

function makeFixture(t) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'batuta-artifact-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));

  for (const relativePath of runtimePaths) {
    fs.cpSync(path.join(repoRoot, relativePath), path.join(fixture, relativePath), {
      recursive: true,
    });
  }

  return fixture;
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(root, relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

test('accepts a complete runtime artifact without source release metadata', (t) => {
  const fixture = makeFixture(t);

  assert.equal(fs.existsSync(path.join(fixture, 'release-please-config.json')), false);
  assert.equal(fs.existsSync(path.join(fixture, 'scripts/check-artifact.js')), false);
  assert.doesNotThrow(() => validateArtifact(fixture));
});

test('rejects malformed manifest JSON with its path', (t) => {
  const fixture = makeFixture(t);
  fs.writeFileSync(path.join(fixture, '.codex-plugin/plugin.json'), '{');

  assert.throws(() => validateArtifact(fixture), /.codex-plugin\/plugin.json.*valid JSON/);
});

test('rejects host and package version mismatch', (t) => {
  const fixture = makeFixture(t);
  const versionPaths = [
    'package.json',
    '.claude-plugin/plugin.json',
    '.codex-plugin/plugin.json',
    '.cursor-plugin/plugin.json',
  ];
  for (const manifestPath of versionPaths) {
    const manifest = readJson(fixture, manifestPath);
    manifest.version = '1.2.3';
    writeJson(fixture, manifestPath, manifest);
  }

  const expectedPackageVersion = readJson(fixture, 'package.json').version;
  const manifest = readJson(fixture, '.cursor-plugin/plugin.json');
  manifest.version = '9.9.9';
  writeJson(fixture, '.cursor-plugin/plugin.json', manifest);

  assert.throws(() => validateArtifact(fixture), {
    message: `invalid artifact: .cursor-plugin/plugin.json version 9.9.9 != package ${expectedPackageVersion}`,
  });
});

test('rejects a missing command target', (t) => {
  const fixture = makeFixture(t);
  fs.rmSync(path.join(fixture, 'skills/batuta-plan/SKILL.md'));

  assert.throws(() => validateArtifact(fixture), /commands\/plan.md.*missing skill target skills\/batuta-plan\/SKILL.md/);
});

test('rejects a changed skills tree digest', (t) => {
  const fixture = makeFixture(t);
  fs.appendFileSync(path.join(fixture, 'skills/batuta/SKILL.md'), '\nchanged\n');

  assert.throws(() => validateArtifact(fixture), /skills tree hash sha256:.* != lock sha256:/);
});

test('rejects missing runtime files and declared paths', (t) => {
  const fixture = makeFixture(t);
  fs.rmSync(path.join(fixture, 'scripts/session-start.sh'));

  assert.throws(() => validateArtifact(fixture), /missing required file scripts\/session-start.sh/);
});

test('rejects traversal in declared paths', (t) => {
  const fixture = makeFixture(t);
  const manifest = readJson(fixture, '.codex-plugin/plugin.json');
  manifest.skills = '../skills';
  writeJson(fixture, '.codex-plugin/plugin.json', manifest);

  assert.throws(() => validateArtifact(fixture), /.codex-plugin\/plugin.json skills.*traversal/);
});

test('rejects symlinks anywhere in the artifact', (t) => {
  const fixture = makeFixture(t);
  fs.symlinkSync('SKILL.md', path.join(fixture, 'skills/batuta/linked.md'));

  assert.throws(() => validateArtifact(fixture), /skills\/batuta\/linked.md.*symbolic link/);
});

test('rejects special files anywhere in the artifact', (t) => {
  const fixture = makeFixture(t);
  const fifo = path.join(fixture, 'skills/batuta/special');
  const result = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);

  assert.throws(() => validateArtifact(fixture), /skills\/batuta\/special.*regular file or directory/);
});

test('rejects a missing command surface', (t) => {
  const fixture = makeFixture(t);
  fs.rmSync(path.join(fixture, 'hosts/opencode/commands/batuta-plan.md'));

  assert.throws(() => validateArtifact(fixture), /missing command hosts\/opencode\/commands\/batuta-plan.md/);
});

test('CLI exits 0 for valid artifacts, 1 for invalid artifacts, and 2 for invalid arguments', (t) => {
  const fixture = makeFixture(t);
  const script = path.join(repoRoot, 'scripts/check-artifact.js');

  assert.equal(spawnSync(process.execPath, [script, fixture]).status, 0);
  fs.rmSync(path.join(fixture, 'bin/install.js'));
  assert.equal(spawnSync(process.execPath, [script, fixture]).status, 1);
  assert.equal(spawnSync(process.execPath, [script]).status, 2);
  assert.equal(spawnSync(process.execPath, [script, fixture, fixture]).status, 2);
});
