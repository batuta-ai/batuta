#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { validateArtifact } = require('./check-artifact.js');

const runFile = promisify(execFile);
const skillsUrl = 'https://github.com/batuta-ai/skills.git';
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
];

async function git(root, args) {
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, {
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    GIT_OPTIONAL_LOCKS: '0',
  });
  try {
    const { stdout } = await runFile('git', [
      '-c', `core.hooksPath=${os.devNull}`, '-C', root, ...args,
    ], { env, encoding: 'utf8', timeout: 30000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    throw new Error(`git ${args[0]} failed: ${error.message}`, { cause: error });
  }
}

async function fetchLockedSkills({ commit, destination }) {
  await git(path.dirname(destination), ['init', '--quiet', '--', destination]);
  await git(destination, ['fetch', '--quiet', '--depth=1', '--no-tags', '--', skillsUrl, commit]);
  await git(destination, ['-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', 'FETCH_HEAD']);
  return destination;
}

function inspectEntry(target) {
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) throw new Error(`${target} is a symbolic link`);
  if (!stat.isFile() && !stat.isDirectory()) {
    throw new Error(`${target} is not a regular file or directory`);
  }
  return stat;
}

function directoryRoot(root, label) {
  if (typeof root !== 'string' || !path.isAbsolute(root)) {
    throw new Error(`${label} must be an absolute directory path`);
  }
  if (!inspectEntry(root).isDirectory()) throw new Error(`${label} is not a directory: ${root}`);
  return fs.realpathSync(root);
}

function sourceEntry(root, relative) {
  let target = root;
  for (const part of relative.split('/')) {
    target = path.join(target, part);
    inspectEntry(target);
  }
  return target;
}

function readRegularFile(target) {
  const stat = inspectEntry(target);
  if (!stat.isFile()) throw new Error(`${target} is not a regular file`);
  const fd = fs.openSync(target, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino) {
      throw new Error(`${target} changed while reading`);
    }
    return { bytes: fs.readFileSync(fd), mode: opened.mode & 0o777 };
  } finally {
    fs.closeSync(fd);
  }
}

function readLock(root) {
  let lock;
  try {
    lock = JSON.parse(readRegularFile(sourceEntry(root, 'skills-lock.json')).bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`skills-lock.json could not be read as JSON: ${error.message}`, { cause: error });
  }
  if (!lock || typeof lock !== 'object' || Array.isArray(lock)) {
    throw new Error('skills-lock.json must be an object');
  }
  const validRef = typeof lock.ref === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(lock.ref)
    && !lock.ref.includes('..') && !lock.ref.includes('//')
    && !lock.ref.split('/').some((part) => part.startsWith('.') || part.endsWith('.') || part.endsWith('.lock'))
    && !lock.ref.endsWith('/');
  for (const [field, valid] of Object.entries({
    source: lock.source === 'github.com/batuta-ai/skills',
    path: lock.path === 'skills',
    ref: validRef,
    commit: typeof lock.commit === 'string' && /^[0-9a-f]{40}$/.test(lock.commit),
    computedHash: typeof lock.computedHash === 'string' && /^sha256:[0-9a-f]{64}$/.test(lock.computedHash),
  })) {
    if (!valid) throw new Error(`skills-lock.json has invalid ${field}`);
  }
  return lock;
}

function overlaps(first, second) {
  const contains = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative));
  };
  return contains(first, second) || contains(second, first);
}

function requireAbsent(output) {
  try {
    fs.lstatSync(output);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`output already exists: ${output}; use a fresh destination`);
}

function resolveExistingParents(target) {
  try {
    return fs.realpathSync(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(target);
    if (parent === target) throw error;
    return path.join(resolveExistingParents(parent), path.basename(target));
  }
}

function resolveOutput(outputDir, repoRoot) {
  if (typeof outputDir !== 'string' || !path.isAbsolute(outputDir)) {
    throw new Error('output must be an absolute directory path');
  }
  const normalized = path.resolve(outputDir);
  let parent;
  try {
    parent = fs.realpathSync(path.dirname(normalized));
    if (!fs.statSync(parent).isDirectory()) throw new Error('not a directory');
  } catch (error) {
    throw new Error(`output parent must be an existing directory: ${error.message}`, { cause: error });
  }
  const output = path.join(parent, path.basename(normalized));
  if (overlaps(output, repoRoot)) throw new Error(`output overlaps host source: ${output}`);
  requireAbsent(output);
  return output;
}

function ensureDirectory(directory) {
  try {
    fs.mkdirSync(directory);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!inspectEntry(directory).isDirectory()) throw new Error(`${directory} is not a directory`);
  }
}

function copyEntry(source, destination) {
  const stat = inspectEntry(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination);
    for (const name of fs.readdirSync(source).sort()) {
      copyEntry(path.join(source, name), path.join(destination, name));
    }
  } else {
    const { bytes, mode } = readRegularFile(source);
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode });
    fs.chmodSync(destination, mode);
  }
}

function copyRuntimeEntry(root, relative, output) {
  const source = sourceEntry(root, relative);
  let parent = output;
  for (const part of relative.split('/').slice(0, -1)) {
    parent = path.join(parent, part);
    ensureDirectory(parent);
  }
  copyEntry(source, path.join(output, relative));
}

function skillsDigest(root) {
  const files = [];
  const visit = (directory, relative = '') => {
    for (const name of fs.readdirSync(directory)) {
      const target = path.join(directory, name);
      const child = path.posix.join(relative, name);
      if (inspectEntry(target).isDirectory()) visit(target, child);
      else files.push(child);
    }
  };
  visit(root);
  const lines = files.sort().map((relative) => {
    const { bytes } = readRegularFile(path.join(root, relative));
    return `${crypto.createHash('sha256').update(bytes).digest('hex')}  ./${relative}\n`;
  });
  return `sha256:${crypto.createHash('sha256').update(lines.join('')).digest('hex')}`;
}

function writeJson(root, name, value) {
  fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
}

async function assemblePackage({ repoRoot, outputDir, fetchSkills = fetchLockedSkills }) {
  const hostRoot = directoryRoot(repoRoot, 'repoRoot');
  const output = resolveOutput(outputDir, hostRoot);
  const lock = readLock(hostRoot);
  const hostCommit = await git(hostRoot, ['rev-parse', '--verify', 'HEAD']);
  if (!/^[0-9a-f]{40}$/.test(hostCommit)) throw new Error('host HEAD must be a 40-hex commit');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'batuta-package-fetch-'));
  let reserved = false;
  let failure;
  try {
    const fetched = await fetchSkills({ commit: lock.commit, destination: path.join(temp, 'checkout') });
    if (typeof fetched !== 'string' || !path.isAbsolute(fetched)) {
      throw new Error('fetched source must be an absolute directory path');
    }
    if (overlaps(output, resolveExistingParents(path.resolve(fetched)))) {
      throw new Error(`output overlaps fetched source: ${output}`);
    }
    const skillsRoot = directoryRoot(fetched, 'fetched source');
    if (overlaps(output, skillsRoot) || overlaps(output, fs.realpathSync(temp))) {
      throw new Error(`output overlaps fetched source: ${output}`);
    }
    const skillsCommit = await git(skillsRoot, ['rev-parse', '--verify', 'HEAD']);
    if (skillsCommit !== lock.commit) throw new Error(`skills commit ${skillsCommit} != lock ${lock.commit}`);
    try {
      fs.mkdirSync(output);
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error(`output already exists: ${output}; use a fresh destination`);
      throw error;
    }
    reserved = true;
    for (const relative of runtimePaths) copyRuntimeEntry(hostRoot, relative, output);
    copyRuntimeEntry(skillsRoot, lock.path, output);
    const treeDigest = skillsDigest(path.join(output, 'skills'));
    if (treeDigest !== lock.computedHash) {
      throw new Error(`skills tree hash ${treeDigest} != lock ${lock.computedHash}`);
    }
    writeJson(output, 'package-provenance.json', {
      schemaVersion: 1, hostCommit, skillsCommit, skillsTreeDigest: treeDigest,
    });
    validateArtifact(output);
  } catch (error) {
    failure = error;
  }
  try {
    fs.rmSync(temp, { recursive: true, force: true });
  } catch (error) {
    failure = new Error(`${failure ? `${failure.message}; ` : ''}could not clean fetch temp ${temp}: ${error.message}`, {
      cause: error,
    });
  }
  try {
    if (failure) throw failure;
    writeJson(output, 'package-ready.json', { schemaVersion: 1, status: 'ready' });
    return output;
  } catch (error) {
    if (reserved) {
      throw new Error(`${error.message}; incomplete output preserved at ${output}; retry with a fresh destination`, {
        cause: error,
      });
    }
    throw error;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--output' || !path.isAbsolute(args[1])) {
    console.error('usage: node scripts/assemble-package.js --output <absolute-directory>');
    process.exitCode = 2;
  } else {
    assemblePackage({ repoRoot: path.resolve(__dirname, '..'), outputDir: args[1] })
      .then((output) => console.log(output))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}

module.exports = { assemblePackage };
