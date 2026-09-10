const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const { assemblePackage } = require('../scripts/assemble-package.js');
const { validateArtifact } = require('../scripts/check-artifact.js');

const projectRoot = path.resolve(__dirname, '..');
const runtimePaths = [
  'package.json', 'LICENSE', 'README.md', 'README.pt-BR.md', 'bin/install.js',
  'commands', 'hosts/opencode/commands', 'hooks/hooks.json', 'scripts/session-start.sh',
  '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json', '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json', '.agents/plugins/marketplace.json', 'skills-lock.json',
];

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function snapshot(root) {
  const files = {};
  function visit(directory, relative = '') {
    for (const name of fs.readdirSync(directory).sort()) {
      const target = path.join(directory, name);
      const key = path.posix.join(relative, name);
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) files[key] = `link:${fs.readlinkSync(target)}`;
      else if (stat.isDirectory()) {
        if (fs.readdirSync(target).length === 0) files[`${key}/`] = 'directory';
        visit(target, key);
      }
      else if (stat.isFile()) files[key] = fs.readFileSync(target).toString('base64');
      else files[key] = 'special';
    }
  }
  visit(root);
  return files;
}

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'batuta-assembly-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repoRoot = path.join(temp, 'host');
  const skillsRoot = path.join(temp, 'dependency');
  fs.mkdirSync(repoRoot);
  fs.mkdirSync(skillsRoot);
  for (const relative of runtimePaths) {
    fs.cpSync(path.join(projectRoot, relative), path.join(repoRoot, relative), { recursive: true });
  }
  fs.cpSync(path.join(projectRoot, 'skills'), path.join(skillsRoot, 'skills'), { recursive: true });
  git(skillsRoot, 'init', '-q');
  git(skillsRoot, 'add', 'skills');
  git(skillsRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture');
  const commit = git(skillsRoot, 'rev-parse', 'HEAD');
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'skills-lock.json'), 'utf8'));
  lock.commit = commit;
  writeLock(repoRoot, lock);
  for (const relative of ['skills/host-only.txt', '.batuta/secret', 'tests/leak',
    'WORK.md', 'scripts/development.js', 'release-please-config.json']) {
    fs.mkdirSync(path.dirname(path.join(repoRoot, relative)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, relative), 'must not ship');
  }
  git(repoRoot, 'init', '-q');
  git(repoRoot, 'add', '.');
  git(repoRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'host fixture');
  const hostCommit = git(repoRoot, 'rev-parse', 'HEAD');
  const calls = [];
  const fetchSkills = async (request) => {
    calls.push(request);
    assert.equal(request.commit, commit);
    assert.equal(fs.existsSync(request.destination), false);
    fs.cpSync(skillsRoot, request.destination, { recursive: true });
    return request.destination;
  };
  return { temp, repoRoot, skillsRoot, lock, commit, hostCommit, calls, fetchSkills,
    outputDir: path.join(temp, 'package') };
}

function writeLock(root, lock) {
  fs.writeFileSync(path.join(root, 'skills-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
}

function assertCleanTemps(calls) {
  for (const { destination } of calls) {
    assert.equal(fs.existsSync(path.dirname(destination)), false, 'owned fetch temp removed');
  }
}

async function rejectsUnchanged(f, pattern, fetchSkills = f.fetchSkills) {
  const before = snapshot(f.repoRoot);
  const dependencyBefore = snapshot(f.skillsRoot);
  await assert.rejects(assemblePackage({ ...f, fetchSkills }), pattern);
  assert.deepEqual(snapshot(f.repoRoot), before);
  assert.deepEqual(snapshot(f.skillsRoot), dependencyBefore);
  assert.equal(fs.existsSync(path.join(f.outputDir, 'package-ready.json')), false);
  assertCleanTemps(f.calls);
}

test('assembles the exact locked dependency, allowlist and deterministic provenance', async (t) => {
  const f = fixture(t);
  const before = snapshot(f.repoRoot);
  const dependencyBefore = snapshot(f.skillsRoot);
  await assemblePackage(f);
  validateArtifact(f.outputDir);
  assert.equal(f.calls.length, 1);
  const provenance = JSON.parse(fs.readFileSync(path.join(f.outputDir, 'package-provenance.json')));
  assert.deepEqual(provenance, {
    schemaVersion: 1, hostCommit: f.hostCommit, skillsCommit: f.commit,
    skillsTreeDigest: f.lock.computedHash,
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.outputDir, 'package-ready.json'))), {
    schemaVersion: 1, status: 'ready',
  });
  const expected = {};
  for (const [relative, bytes] of Object.entries(before)) {
    if (runtimePaths.some((allowed) => relative === allowed || relative.startsWith(`${allowed}/`))) {
      expected[relative] = bytes;
    }
  }
  for (const [relative, bytes] of Object.entries(dependencyBefore)) {
    if (relative.startsWith('skills/')) expected[relative] = bytes;
  }
  const actual = snapshot(f.outputDir);
  delete actual['package-provenance.json'];
  delete actual['package-ready.json'];
  assert.deepEqual(actual, expected);
  const second = path.join(f.temp, 'second');
  await assemblePackage({ ...f, outputDir: second });
  assert.deepEqual(snapshot(f.outputDir), snapshot(second));
  assert.deepEqual(snapshot(f.repoRoot), before);
  assert.deepEqual(snapshot(f.skillsRoot), dependencyBefore);
  assertCleanTemps(f.calls);
});

test('rejects malformed lock fields before fetching', async (t) => {
  const f = fixture(t);
  const invalid = [null, [], {}, { ...f.lock, source: 'github.com/other/skills' },
    { ...f.lock, path: '../skills' }, { ...f.lock, ref: '' }, { ...f.lock, ref: '--upload-pack=bad' },
    { ...f.lock, ref: 'v1\ncommand' }, { ...f.lock, commit: 'main' },
    { ...f.lock, commit: 'a'.repeat(39) }, { ...f.lock, computedHash: 'sha256:no' }];
  for (const lock of invalid) {
    writeLock(f.repoRoot, lock);
    await rejectsUnchanged(f, /skills-lock.json/);
  }
  fs.writeFileSync(path.join(f.repoRoot, 'skills-lock.json'), '{');
  await rejectsUnchanged(f, /skills-lock.json.*JSON/);
  assert.equal(f.calls.length, 0);
});

test('verifies fetched HEAD rather than trusting the fetcher or descriptive ref', async (t) => {
  const f = fixture(t);
  f.lock.ref = 'descriptive-ref-does-not-exist';
  writeLock(f.repoRoot, f.lock);
  await rejectsUnchanged(f, /skills commit.*!= lock/, async (request) => {
    const root = await f.fetchSkills(request);
    git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
      '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-qm', 'wrong commit');
    return root;
  });
});

test('rejects a changed dependency digest and preserves incomplete output', async (t) => {
  const f = fixture(t);
  await rejectsUnchanged(f, /skills tree hash.*!= lock.*incomplete output/s, async (request) => {
    const root = await f.fetchSkills(request);
    fs.appendFileSync(path.join(root, 'skills/batuta/SKILL.md'), '\nchanged\n');
    return root;
  });
  assert.equal(fs.statSync(f.outputDir).isDirectory(), true);
});

test('cleans owned fetch temps on fetch failure before reserving output', async (t) => {
  const f = fixture(t);
  await rejectsUnchanged(f, /fetch unavailable/, async (request) => {
    await f.fetchSkills(request);
    throw new Error('fetch unavailable');
  });
  assert.equal(fs.existsSync(f.outputDir), false);
});

test('rejects existing directories, files and dangling links without fetching or changing them', async (t) => {
  const f = fixture(t);
  for (const kind of ['directory', 'file', 'link']) {
    f.outputDir = path.join(f.temp, kind);
    if (kind === 'directory') {
      fs.mkdirSync(f.outputDir);
      fs.writeFileSync(path.join(f.outputDir, 'sentinel'), 'keep');
    } else if (kind === 'file') fs.writeFileSync(f.outputDir, 'keep');
    else fs.symlinkSync('missing', f.outputDir);
    const before = snapshot(f.temp);
    await assert.rejects(assemblePackage(f), /output.*already exists/);
    assert.deepEqual(snapshot(f.temp), before);
  }
  assert.equal(f.calls.length, 0);
});

test('requires absolute output with an existing parent and rejects source containment through aliases', async (t) => {
  const f = fixture(t);
  for (const outputDir of ['', 'relative', path.join(f.temp, 'missing', 'package')]) {
    await assert.rejects(assemblePackage({ ...f, outputDir }), /output.*(absolute|parent)/);
  }
  const alias = path.join(f.temp, 'alias');
  fs.symlinkSync(f.repoRoot, alias);
  for (const outputDir of [path.join(f.repoRoot, 'package'), path.join(alias, 'package')]) {
    await assert.rejects(assemblePackage({ ...f, outputDir }), /output.*overlap.*source/);
    assert.equal(fs.existsSync(outputDir), false);
  }
  assert.equal(f.calls.length, 0);
});

test('accepts an external parent alias after resolving containment', async (t) => {
  const f = fixture(t);
  const alias = path.join(f.temp, 'alias');
  fs.symlinkSync(f.temp, alias);
  await assemblePackage({ ...f, outputDir: path.join(alias, 'package') });
  validateArtifact(f.outputDir);
});

test('rejects output overlapping returned fetched source in either direction', async (t) => {
  const f = fixture(t);
  for (const direction of ['inside', 'ancestor', 'same']) {
    f.outputDir = direction === 'inside' ? path.join(f.skillsRoot, 'output')
      : path.join(f.temp, direction);
    await rejectsUnchanged(f, /output.*overlap.*fetched source/,
      async () => direction === 'inside' ? f.skillsRoot
        : direction === 'same' ? f.outputDir : path.join(f.outputDir, 'dependency'));
    assert.equal(fs.existsSync(f.outputDir), false);
  }
});

test('rejects links and special files in selected host and fetched paths', async (t) => {
  for (const [side, relative, kind] of [
    ['host', 'bin', 'link'], ['host', 'README.md', 'link'],
    ['host', 'commands/special', 'fifo'], ['fetched', 'skills/batuta/linked', 'link'],
    ['fetched', 'skills/batuta/special', 'fifo'], ['fetched', 'skills', 'link'],
  ]) {
    const f = fixture(t);
    const root = side === 'host' ? f.repoRoot : f.skillsRoot;
    const target = path.join(root, relative);
    fs.rmSync(target, { recursive: true, force: true });
    if (kind === 'link') fs.symlinkSync(path.join(f.temp, 'absent'), target);
    else {
      const result = spawnSync('mkfifo', [target]);
      assert.ifError(result.error);
      assert.equal(result.status, 0);
    }
    // Return this local checkout directly so fixture copying cannot follow or block on the entry.
    await rejectsUnchanged(f, /symbolic link|regular file or directory/,
      async () => f.skillsRoot);
  }
});

test('preserves a partially copied output, with no ready marker, when copying fails', async (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.repoRoot, 'README.pt-BR.md'));
  await rejectsUnchanged(f, /README.pt-BR.md.*incomplete output/s);
  assert.equal(fs.existsSync(path.join(f.outputDir, 'package.json')), true);
  await rejectsUnchanged(f, /output.*already exists.*fresh destination/);
});

test('validates the payload before writing its final ready marker', async (t) => {
  const f = fixture(t);
  const manifest = path.join(f.repoRoot, '.codex-plugin/plugin.json');
  const value = JSON.parse(fs.readFileSync(manifest));
  value.version = 'wrong';
  fs.writeFileSync(manifest, JSON.stringify(value));
  await rejectsUnchanged(f, /invalid artifact:.*version.*incomplete output/s);
  assert.equal(fs.existsSync(path.join(f.outputDir, 'package-provenance.json')), true);
});

test('cleanup failure is reported before the package can be marked ready', async (t) => {
  const f = fixture(t);
  const remove = fs.rmSync;
  const mocked = t.mock.method(fs, 'rmSync', (target, options) => {
    if (path.basename(target).startsWith('batuta-package-fetch-')) {
      throw new Error('cleanup denied');
    }
    return remove(target, options);
  });
  const before = snapshot(f.repoRoot);
  try {
    await assert.rejects(assemblePackage(f), /cleanup denied.*incomplete output.*fresh destination/s);
    assert.equal(fs.existsSync(path.join(f.outputDir, 'package-ready.json')), false);
    assert.deepEqual(snapshot(f.repoRoot), before);
  } finally {
    mocked.mock.restore();
    for (const { destination } of f.calls) remove(path.dirname(destination), { recursive: true, force: true });
  }
});

test('competing assemblers cannot overwrite the reserved destination', async (t) => {
  const f = fixture(t);
  let unblock;
  const blocked = new Promise((resolve) => { unblock = resolve; });
  let entrants = 0;
  const fetchSkills = async (request) => {
    entrants += 1;
    if (entrants === 2) unblock();
    await blocked;
    assert.equal(fs.existsSync(path.join(f.outputDir, 'package-ready.json')), false);
    return f.fetchSkills(request);
  };
  const before = snapshot(f.repoRoot);
  const outcomes = await Promise.allSettled([
    assemblePackage({ ...f, fetchSkills }), assemblePackage({ ...f, fetchSkills }),
  ]);
  assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.match(outcomes.find(({ status }) => status === 'rejected').reason.message, /output.*already exists/);
  validateArtifact(f.outputDir);
  assert.deepEqual(snapshot(f.repoRoot), before);
  assertCleanTemps(f.calls);
});

test('does not replace a destination introduced after the initial existence check', async (t) => {
  const f = fixture(t);
  await rejectsUnchanged(f, /output.*already exists/, async (request) => {
    fs.mkdirSync(f.outputDir);
    fs.writeFileSync(path.join(f.outputDir, 'sentinel'), 'other writer');
    return f.fetchSkills(request);
  });
  assert.deepEqual(snapshot(f.outputDir), { sentinel: Buffer.from('other writer').toString('base64') });
});

test('CLI rejects invalid arguments and relative output without network access', () => {
  const script = path.join(projectRoot, 'scripts/assemble-package.js');
  for (const args of [[], ['--output'], ['--unknown', '/tmp/out'],
    ['--output', '/tmp/out', 'extra'], ['--output', 'relative']]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /usage:.*--output.*absolute/);
  }
});

test('production fetch uses the fixed URL and exact commit; CLI builds offline and reports failures', async (t) => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.skillsRoot, 'skills/batuta/SKILL.md'), '\nnewer revision\n');
  git(f.skillsRoot, 'add', 'skills');
  git(f.skillsRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'newer dependency');
  const lookup = spawnSync('which', ['git'], { encoding: 'utf8' });
  assert.equal(lookup.status, 0);
  const shimDirectory = path.join(f.temp, 'git-shim');
  fs.mkdirSync(shimDirectory);
  const log = path.join(f.temp, 'git-calls.jsonl');
  const shim = `#!${process.execPath}
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
const url = args.indexOf('https://github.com/batuta-ai/skills.git');
if (args.includes('fetch')) {
  if (url === -1) process.exit(90);
  args[url] = ${JSON.stringify(f.skillsRoot)};
}
const result = spawnSync(${JSON.stringify(lookup.stdout.trim())}, args, { stdio: 'inherit' });
process.exit(result.status === null ? 91 : result.status);
`;
  fs.writeFileSync(path.join(shimDirectory, 'git'), shim, { mode: 0o755 });
  for (const script of ['assemble-package.js', 'check-artifact.js']) {
    fs.copyFileSync(path.join(projectRoot, 'scripts', script), path.join(f.repoRoot, 'scripts', script));
  }
  const before = snapshot(f.repoRoot);
  const dependencyBefore = snapshot(f.skillsRoot);
  const script = path.join(f.repoRoot, 'scripts/assemble-package.js');
  const env = { ...process.env, PATH: `${shimDirectory}${path.delimiter}${process.env.PATH}` };
  const run = (outputDir) => spawnSync(process.execPath, [script, '--output', outputDir], {
    encoding: 'utf8', env, timeout: 15000,
  });
  const result = run(f.outputDir);
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), fs.realpathSync(f.outputDir));
  validateArtifact(f.outputDir);
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  const fetch = calls.find((args) => args.includes('fetch'));
  assert.deepEqual(fetch.slice(fetch.indexOf('fetch')), [
    'fetch', '--quiet', '--depth=1', '--no-tags', '--', 'https://github.com/batuta-ai/skills.git', f.commit,
  ]);
  assert.equal(calls.some((args) => args.includes(f.lock.ref)), false);
  assert.equal(calls.filter((args) => args.includes('rev-parse') && args.includes('HEAD')).length, 2);
  const init = calls.find((args) => args.includes('init'));
  assert.equal(fs.existsSync(path.dirname(init.at(-1))), false);
  const existing = run(f.outputDir);
  assert.equal(existing.status, 1);
  assert.match(existing.stderr, /output already exists/);
  assert.deepEqual(snapshot(f.repoRoot), before);
  assert.deepEqual(snapshot(f.skillsRoot), dependencyBefore);
  writeLock(f.repoRoot, { ...f.lock, commit: '1'.repeat(40) });
  const failed = run(path.join(f.temp, 'unavailable'));
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /git fetch failed/);
  const failureCalls = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  for (const args of failureCalls.filter((args) => args.includes('init'))) {
    assert.equal(fs.existsSync(path.dirname(args.at(-1))), false);
  }
});
