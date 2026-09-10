const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const zlib = require('node:zlib');

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
const metadataFiles = ['package-provenance.json', 'package-ready.json'];

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function files(root) {
  const entries = {};
  function visit(directory, relative = '') {
    for (const name of fs.readdirSync(directory).sort()) {
      const target = path.join(directory, name);
      const key = path.posix.join(relative, name);
      const stat = fs.lstatSync(target);
      assert.equal(stat.isSymbolicLink(), false, `${key} must not be a symbolic link`);
      if (stat.isDirectory()) visit(target, key);
      else {
        assert.equal(stat.isFile(), true, `${key} must be a regular file`);
        entries[key] = fs.readFileSync(target);
      }
    }
  }
  visit(root);
  return entries;
}

function addExpectedEntry(expected, root, relative) {
  const target = path.join(root, relative);
  const stat = fs.lstatSync(target);
  assert.equal(stat.isSymbolicLink(), false, `${relative} source must not be a symbolic link`);
  if (stat.isDirectory()) {
    for (const [child, bytes] of Object.entries(files(target))) {
      expected[path.posix.join(relative, child)] = bytes;
    }
  } else {
    assert.equal(stat.isFile(), true, `${relative} source must be a regular file`);
    expected[relative] = fs.readFileSync(target);
  }
}

function expectedPayload(f) {
  const expected = {};
  for (const relative of runtimePaths) addExpectedEntry(expected, f.repoRoot, relative);
  addExpectedEntry(expected, f.skillsRoot, 'skills');

  const lock = JSON.parse(fs.readFileSync(path.join(f.repoRoot, 'skills-lock.json'), 'utf8'));
  const metadata = {
    'package-provenance.json': {
      schemaVersion: 1,
      hostCommit: git(f.repoRoot, 'rev-parse', '--verify', 'HEAD'),
      skillsCommit: lock.commit,
      skillsTreeDigest: lock.computedHash,
    },
    'package-ready.json': { schemaVersion: 1, status: 'ready' },
  };
  for (const name of metadataFiles) {
    expected[name] = Buffer.from(`${JSON.stringify(metadata[name], null, 2)}\n`);
  }
  return expected;
}

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'batuta-package-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repoRoot = path.join(temp, 'host');
  const skillsRoot = path.join(temp, 'dependency');
  fs.mkdirSync(repoRoot);
  fs.mkdirSync(skillsRoot);
  for (const relative of runtimePaths) {
    fs.cpSync(path.join(projectRoot, relative), path.join(repoRoot, relative), { recursive: true });
  }
  fs.cpSync(path.join(projectRoot, 'skills'), path.join(skillsRoot, 'skills'), { recursive: true });
  for (const relative of ['.batuta/private', 'tests/leak', 'WORK.md']) {
    fs.mkdirSync(path.dirname(path.join(repoRoot, relative)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, relative), 'must not ship\n');
  }
  git(skillsRoot, 'init', '-q');
  git(skillsRoot, 'add', 'skills');
  git(skillsRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture');
  const skillsCommit = git(skillsRoot, 'rev-parse', 'HEAD');
  const lockPath = path.join(repoRoot, 'skills-lock.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.commit = skillsCommit;
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  git(repoRoot, 'init', '-q');
  git(repoRoot, 'add', '.');
  git(repoRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'host fixture');
  const fetchSkills = async ({ commit, destination }) => {
    assert.equal(commit, skillsCommit);
    fs.cpSync(skillsRoot, destination, { recursive: true });
    return destination;
  };
  return { temp, repoRoot, skillsRoot, fetchSkills, outputDir: path.join(temp, 'payload') };
}

function tarString(block, start, length) {
  const end = block.indexOf(0, start);
  return block.subarray(start, end === -1 || end > start + length ? start + length : end)
    .toString('utf8');
}

function tarNumber(block, start, length) {
  const value = tarString(block, start, length).trim();
  return value === '' ? 0 : Number.parseInt(value, 8);
}

function extractArchive(archive, destination) {
  const tar = zlib.gunzipSync(fs.readFileSync(archive));
  fs.mkdirSync(destination);
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const storedChecksum = tarNumber(header, 148, 8);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    assert.equal(checksumHeader.reduce((sum, byte) => sum + byte, 0), storedChecksum,
      'tar header checksum must match');
    const name = tarString(header, 0, 100);
    const prefix = tarString(header, 345, 155);
    const entry = prefix ? `${prefix}/${name}` : name;
    assert.equal(entry.startsWith('package/'), true, `tar entry must stay under package/: ${entry}`);
    const relative = entry.slice('package/'.length).replace(/\/$/, '');
    assert.notEqual(relative, '');
    assert.equal(path.posix.normalize(relative), relative, `unsafe tar path: ${entry}`);
    assert.equal(path.posix.isAbsolute(relative), false, `absolute tar path: ${entry}`);
    assert.equal(relative.split('/').includes('..'), false, `traversing tar path: ${entry}`);
    const target = path.resolve(destination, ...relative.split('/'));
    assert.equal(target.startsWith(`${path.resolve(destination)}${path.sep}`), true,
      `tar entry escapes destination: ${entry}`);
    const size = tarNumber(header, 124, 12);
    const type = String.fromCharCode(header[156] || 0x30);
    const contents = tar.subarray(offset + 512, offset + 512 + size);
    assert.equal(contents.length, size, `truncated tar entry: ${entry}`);
    if (type === '5') fs.mkdirSync(target, { recursive: true });
    else {
      assert.equal(type, '0', `unsupported tar entry type ${type}: ${entry}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents, { flag: 'wx' });
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return destination;
}

function assertReady(payload) {
  const markerPath = path.join(payload, 'package-ready.json');
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch (error) {
    throw new Error(`package-ready.json is required and must be valid JSON: ${error.message}`);
  }
  assert.deepEqual(marker, { schemaVersion: 1, status: 'ready' });
}

function pack(payload, destination, configRoot) {
  assertReady(payload);
  fs.mkdirSync(destination);
  const userConfig = path.join(configRoot, 'npm-user-config');
  const globalConfig = path.join(configRoot, 'npm-global-config');
  fs.writeFileSync(userConfig, '');
  fs.writeFileSync(globalConfig, '');
  const result = spawnSync('npm', [
    'pack', '--ignore-scripts', '--json', '--pack-destination', destination, payload,
  ], {
    cwd: configRoot, encoding: 'utf8', timeout: 30000,
    env: {
      ...process.env,
      npm_config_audit: 'false',
      npm_config_cache: path.join(configRoot, 'npm-cache'),
      npm_config_fund: 'false',
      npm_config_globalconfig: globalConfig,
      npm_config_registry: 'https://registry.invalid/',
      npm_config_update_notifier: 'false',
      npm_config_userconfig: userConfig,
    },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.length, 1);
  return path.join(destination, report[0].filename);
}

function assertExactPayload(extracted, expected) {
  const actual = files(extracted);
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
  for (const [relative, bytes] of Object.entries(expected)) {
    assert.deepEqual(actual[relative], bytes, `${relative} must match its approved source`);
  }
  for (const forbidden of ['.batuta', 'tests', 'WORK.md']) {
    assert.equal(Object.keys(actual).some((relative) => relative === forbidden
      || relative.startsWith(`${forbidden}/`)), false, `${forbidden} must not be packed`);
  }
  for (const qaSkill of ['batuta-qa-plan', 'batuta-qa-run']) {
    assert.ok(actual[`skills/${qaSkill}/SKILL.md`], `${qaSkill} must be packed`);
  }
  assert.deepEqual(JSON.parse(actual['package-ready.json']), { schemaVersion: 1, status: 'ready' });
  const provenance = JSON.parse(actual['package-provenance.json']);
  assert.equal(provenance.schemaVersion, 1);
  assert.match(provenance.hostCommit, /^[0-9a-f]{40}$/);
  assert.match(provenance.skillsCommit, /^[0-9a-f]{40}$/);
  assert.match(provenance.skillsTreeDigest, /^sha256:[0-9a-f]{64}$/);
}

test('packs two byte-identical, allowlisted, standalone runtime archives', async (t) => {
  const f = fixture(t);
  const sourceBefore = files(f.repoRoot);
  const skillsBefore = files(f.skillsRoot);
  await assemblePackage(f);
  const expected = expectedPayload(f);
  const first = pack(f.outputDir, path.join(f.temp, 'archives-1'), f.temp);
  const second = pack(f.outputDir, path.join(f.temp, 'archives-2'), f.temp);
  assert.deepEqual(fs.readFileSync(first), fs.readFileSync(second));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(first)).digest('hex'),
    crypto.createHash('sha256').update(fs.readFileSync(second)).digest('hex'));

  const extracted = extractArchive(first, path.join(f.temp, 'extracted'));
  assertExactPayload(extracted, expected);
  assert.doesNotThrow(() => validateArtifact(extracted));
  assert.equal(fs.existsSync(path.join(extracted, 'release-please-config.json')), false);
  assert.equal(fs.existsSync(path.join(extracted, 'tests')), false);
  assert.deepEqual(files(f.repoRoot), sourceBefore);
  assert.deepEqual(files(f.skillsRoot), skillsBefore);
});

test('refuses incomplete payloads before npm pack and detects leaked or omitted content', async (t) => {
  const f = fixture(t);
  await assemblePackage(f);
  const readyPath = path.join(f.outputDir, 'package-ready.json');
  const ready = fs.readFileSync(readyPath);
  fs.rmSync(readyPath);
  assert.throws(() => pack(f.outputDir, path.join(f.temp, 'missing'), f.temp),
    /package-ready.json is required/);
  assert.equal(fs.existsSync(path.join(f.temp, 'missing')), false);
  fs.writeFileSync(readyPath, '{bad json');
  assert.throws(() => pack(f.outputDir, path.join(f.temp, 'malformed'), f.temp),
    /package-ready.json is required and must be valid JSON/);
  assert.equal(fs.existsSync(path.join(f.temp, 'malformed')), false);
  fs.writeFileSync(readyPath, JSON.stringify({ schemaVersion: 1, status: 'assembling' }));
  assert.throws(() => pack(f.outputDir, path.join(f.temp, 'not-ready'), f.temp));
  assert.equal(fs.existsSync(path.join(f.temp, 'not-ready')), false);
  fs.writeFileSync(readyPath, JSON.stringify({
    schemaVersion: 1, status: 'ready', unexpected: true,
  }));
  assert.throws(() => pack(f.outputDir, path.join(f.temp, 'over-specified'), f.temp));
  assert.equal(fs.existsSync(path.join(f.temp, 'over-specified')), false);
  fs.writeFileSync(readyPath, ready);

  fs.writeFileSync(path.join(f.outputDir, 'README-secret.txt'), 'unknown payload content\n');
  const expected = expectedPayload(f);
  const arbitraryArchive = pack(f.outputDir, path.join(f.temp, 'arbitrary-archive'), f.temp);
  const arbitraryExtracted = extractArchive(arbitraryArchive,
    path.join(f.temp, 'arbitrary-extracted'));
  assert.throws(() => assertExactPayload(arbitraryExtracted, expected));
  fs.rmSync(path.join(f.outputDir, 'README-secret.txt'));

  const leaked = path.join(f.temp, 'leaked');
  fs.cpSync(f.outputDir, leaked, { recursive: true });
  fs.mkdirSync(path.join(leaked, '.batuta'));
  fs.writeFileSync(path.join(leaked, '.batuta', 'private'), 'leak');
  const leakedArchive = pack(leaked, path.join(f.temp, 'leaked-archive'), f.temp);
  const leakedExtracted = extractArchive(leakedArchive, path.join(f.temp, 'leaked-extracted'));
  assert.throws(() => assertExactPayload(leakedExtracted, expected));

  const omitted = path.join(f.temp, 'omitted');
  fs.cpSync(f.outputDir, omitted, { recursive: true });
  fs.rmSync(path.join(omitted, 'skills', 'batuta-qa-run'), { recursive: true });
  const omittedArchive = pack(omitted, path.join(f.temp, 'omitted-archive'), f.temp);
  const omittedExtracted = extractArchive(omittedArchive, path.join(f.temp, 'omitted-extracted'));
  assert.throws(() => assertExactPayload(omittedExtracted, expected));
});

test('extracted installer preserves customized QA skills until force is explicit', async (t) => {
  const f = fixture(t);
  const sourceBefore = files(f.repoRoot);
  const skillsBefore = files(f.skillsRoot);
  await assemblePackage(f);
  const archive = pack(f.outputDir, path.join(f.temp, 'installer-archive'), f.temp);
  const extracted = extractArchive(archive, path.join(f.temp, 'installer-extracted'));
  const { installSharedSkills } = require(path.join(extracted, 'bin', 'install.js'));
  const dst = path.join(f.temp, 'shared-skills');
  const unrelated = path.join(f.temp, 'unrelated');
  fs.mkdirSync(unrelated);
  fs.writeFileSync(path.join(unrelated, 'sentinel'), 'untouched');
  const paths = {
    src: path.join(extracted, 'skills'),
    dst,
    lockSrc: path.join(extracted, 'skills-lock.json'),
  };

  installSharedSkills(false, paths);
  for (const qaSkill of ['batuta-qa-plan', 'batuta-qa-run']) {
    assert.equal(fs.existsSync(path.join(dst, qaSkill, 'SKILL.md')), true);
  }
  const customized = path.join(dst, 'batuta-qa-plan', 'SKILL.md');
  const packaged = fs.readFileSync(path.join(paths.src, 'batuta-qa-plan', 'SKILL.md'));
  fs.appendFileSync(customized, '\nLOCAL CUSTOMIZATION\n');
  installSharedSkills(false, paths);
  assert.match(fs.readFileSync(customized, 'utf8'), /LOCAL CUSTOMIZATION/);
  installSharedSkills(false, { ...paths, force: true });
  assert.deepEqual(fs.readFileSync(customized), packaged);
  assert.equal(fs.readFileSync(path.join(unrelated, 'sentinel'), 'utf8'), 'untouched');
  assert.deepEqual(files(f.repoRoot), sourceBefore);
  assert.deepEqual(files(f.skillsRoot), skillsBefore);
});

test('local packaging documentation matches the tested commands and recovery contract', () => {
  const guide = fs.readFileSync(path.join(projectRoot, 'docs', 'skills-packaging.md'), 'utf8');
  const english = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
  const portuguese = fs.readFileSync(path.join(projectRoot, 'README.pt-BR.md'), 'utf8');
  for (const document of [guide, english, portuguese]) {
    assert.match(document, /node scripts\/assemble-package\.js --output/);
    assert.match(document, /npm pack --ignore-scripts/);
    assert.match(document, /node scripts\/check-artifact\.js/);
    assert.match(document, /package-ready\.json/);
    assert.match(document,
      /assert\.deepEqual\(marker, \{ schemaVersion: 1, status: "ready" \}\)/);
  }
  assert.match(guide, /Node\.js 22/);
  assert.match(guide, /\bgit\b/);
  assert.match(guide, /\bnpm\b/);
  assert.match(guide, /fresh destination/);
  assert.match(guide, /does not publish/i);
  assert.match(english, /does not publish/i);
  assert.match(portuguese, /não publica/i);
});
