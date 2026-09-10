#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const requiredFiles = [
  'package.json',
  'LICENSE',
  'README.md',
  'README.pt-BR.md',
  'bin/install.js',
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
const requiredDirectories = ['commands', 'hosts/opencode/commands', 'skills'];
const jsonFiles = [
  'package.json',
  'hooks/hooks.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
  'skills-lock.json',
];

function artifactError(message) {
  return new Error(`invalid artifact: ${message}`);
}

function inspectTree(root) {
  const rootStat = fs.lstatSync(root);
  if (rootStat.isSymbolicLink()) {
    throw artifactError(`${root} is a symbolic link`);
  }
  if (!rootStat.isDirectory()) {
    throw artifactError(`${root} is not a directory`);
  }

  const visit = (directory, relativeDirectory = '') => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      const fullPath = path.join(directory, entry.name);
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        throw artifactError(`${relativePath} is a symbolic link`);
      }
      if (stat.isDirectory()) {
        visit(fullPath, relativePath);
      } else if (!stat.isFile()) {
        throw artifactError(`${relativePath} is not a regular file or directory`);
      }
    }
  };

  visit(root);
}

function requireEntry(root, relativePath, kind) {
  const fullPath = path.join(root, relativePath);
  let stat;
  try {
    stat = fs.lstatSync(fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw artifactError(`missing required ${kind} ${relativePath}`);
    }
    throw error;
  }

  if (kind === 'file' && !stat.isFile()) {
    throw artifactError(`${relativePath} is not a regular file`);
  }
  if (kind === 'directory' && !stat.isDirectory()) {
    throw artifactError(`${relativePath} is not a directory`);
  }
}

function readJson(root, relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw artifactError(`${relativePath} is not valid JSON: ${error.message}`);
    }
    throw error;
  }
}

function declaredPath(relativePath, label) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw artifactError(`${label} must be a non-empty relative path`);
  }

  const portablePath = relativePath.replaceAll('\\', '/');
  if (path.posix.isAbsolute(portablePath) || portablePath.split('/').includes('..')) {
    throw artifactError(`${label} contains path traversal`);
  }

  const normalized = path.posix.normalize(portablePath);
  if (normalized === '.' || normalized.startsWith('./')) {
    return normalized;
  }
  return normalized.replace(/^\.\//, '');
}

function requireDeclaredTarget(root, relativePath, label, kind) {
  const normalized = declaredPath(relativePath, label);
  const target = path.resolve(root, normalized);
  const relativeTarget = path.relative(root, target);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    throw artifactError(`${label} contains path traversal`);
  }

  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw artifactError(`${label} target ${normalized} is missing`);
    }
    throw error;
  }

  if ((kind === 'file' && !stat.isFile()) || (kind === 'directory' && !stat.isDirectory())) {
    throw artifactError(`${label} target ${normalized} is not a ${kind}`);
  }
}

function validateVersions(manifests) {
  const packageVersion = manifests['package.json'].version;
  if (typeof packageVersion !== 'string' || packageVersion.length === 0) {
    throw artifactError('package.json version must be a non-empty string');
  }

  for (const manifestPath of [
    '.claude-plugin/plugin.json',
    '.codex-plugin/plugin.json',
    '.cursor-plugin/plugin.json',
  ]) {
    const hostVersion = manifests[manifestPath].version;
    if (hostVersion !== packageVersion) {
      throw artifactError(`${manifestPath} version ${hostVersion} != package ${packageVersion}`);
    }
  }
}

function collectRegularFiles(root, relativeDirectory) {
  const files = [];
  const visit = (directory, relativePath) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const childRelativePath = path.posix.join(relativePath, entry.name);
      const childPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(childPath, childRelativePath);
      } else if (entry.isFile()) {
        files.push(childRelativePath);
      }
    }
  };
  visit(path.join(root, relativeDirectory), '.');
  return files.sort();
}

function skillsDigest(root) {
  const skillsRoot = path.join(root, 'skills');
  const lines = collectRegularFiles(root, 'skills').map((relativePath) => {
    const contents = fs.readFileSync(path.join(skillsRoot, relativePath));
    const digest = crypto.createHash('sha256').update(contents).digest('hex');
    return `${digest}  ./${relativePath}\n`;
  });
  return `sha256:${crypto.createHash('sha256').update(lines.join('')).digest('hex')}`;
}

function validateSkills(root, lock) {
  if (typeof lock.computedHash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(lock.computedHash)) {
    throw artifactError('skills-lock.json computedHash must be a sha256 digest');
  }

  const actualHash = skillsDigest(root);
  if (actualHash !== lock.computedHash) {
    throw artifactError(`skills tree hash ${actualHash} != lock ${lock.computedHash}`);
  }
}

function skillNames(root) {
  return fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md')))
    .sort();
}

function commandTarget(root, relativePath) {
  const contents = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const match = contents.match(/`(batuta(?:-[a-z]+)*)` skill/);
  if (!match) {
    throw artifactError(`${relativePath} does not route to a skill`);
  }

  const target = `skills/${match[1]}/SKILL.md`;
  if (!fs.existsSync(path.join(root, target))) {
    throw artifactError(`${relativePath} has missing skill target ${target}`);
  }
  return match[1];
}

function validateCommands(root) {
  const skills = skillNames(root);
  if (!skills.includes('batuta')) {
    throw artifactError('missing declared skill skills/batuta/SKILL.md');
  }

  const surfaces = [
    {
      directory: 'commands',
      expected: skills.filter((name) => name !== 'batuta')
        .map((name) => [`${name.slice('batuta-'.length)}.md`, name]),
    },
    {
      directory: 'hosts/opencode/commands',
      expected: skills.map((name) => [`${name}.md`, name]),
    },
  ];

  for (const surface of surfaces) {
    for (const [filename, expectedSkill] of surface.expected) {
      const commandPath = path.posix.join(surface.directory, filename);
      if (!fs.existsSync(path.join(root, commandPath))) {
        throw artifactError(`missing command ${commandPath}`);
      }
      const actualSkill = commandTarget(root, commandPath);
      if (actualSkill !== expectedSkill) {
        throw artifactError(`${commandPath} routes to ${actualSkill}, expected ${expectedSkill}`);
      }
    }

    for (const filename of fs.readdirSync(path.join(root, surface.directory))) {
      if (filename.endsWith('.md')) {
        commandTarget(root, path.posix.join(surface.directory, filename));
      }
    }
  }
}

function validateDeclarations(root, manifests) {
  const packageBins = manifests['package.json'].bin;
  if (!packageBins || typeof packageBins !== 'object' || Array.isArray(packageBins)) {
    throw artifactError('package.json bin must declare command targets');
  }
  for (const [name, target] of Object.entries(packageBins)) {
    requireDeclaredTarget(root, target, `package.json bin.${name}`, 'file');
  }

  for (const manifestPath of ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
    requireDeclaredTarget(root, manifests[manifestPath].skills, `${manifestPath} skills`, 'directory');
  }

  for (const manifestPath of [
    '.claude-plugin/marketplace.json',
    '.cursor-plugin/marketplace.json',
  ]) {
    const plugins = manifests[manifestPath].plugins;
    if (!Array.isArray(plugins) || plugins.length === 0) {
      throw artifactError(`${manifestPath} must declare plugins`);
    }
    plugins.forEach((plugin, index) => {
      requireDeclaredTarget(root, plugin.source, `${manifestPath} plugins[${index}].source`, 'directory');
    });
  }

  const agentPlugins = manifests['.agents/plugins/marketplace.json'].plugins;
  if (!Array.isArray(agentPlugins) || agentPlugins.length === 0) {
    throw artifactError('.agents/plugins/marketplace.json must declare plugins');
  }
  agentPlugins.forEach((plugin, index) => {
    requireDeclaredTarget(
      root,
      plugin.source && plugin.source.path,
      `.agents/plugins/marketplace.json plugins[${index}].source.path`,
      'directory',
    );
  });

  const sessionHooks = manifests['hooks/hooks.json'].hooks
    && manifests['hooks/hooks.json'].hooks.SessionStart;
  if (!Array.isArray(sessionHooks) || sessionHooks.length === 0) {
    throw artifactError('hooks/hooks.json must declare SessionStart hooks');
  }
  for (const group of sessionHooks) {
    if (!Array.isArray(group.hooks)) {
      throw artifactError('hooks/hooks.json SessionStart entry must declare hooks');
    }
    for (const hook of group.hooks) {
      if (hook.type !== 'command' || typeof hook.command !== 'string') {
        throw artifactError('hooks/hooks.json hook must declare a command');
      }
      const match = hook.command.match(/^bash "\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\n]+)"$/);
      if (!match) {
        throw artifactError('hooks/hooks.json command must target CLAUDE_PLUGIN_ROOT');
      }
      requireDeclaredTarget(root, match[1], 'hooks/hooks.json command', 'file');
    }
  }
}

function validateArtifact(root) {
  if (typeof root !== 'string' || root.length === 0) {
    throw artifactError('root must be a directory path');
  }

  inspectTree(root);
  for (const relativePath of requiredFiles) requireEntry(root, relativePath, 'file');
  for (const relativePath of requiredDirectories) requireEntry(root, relativePath, 'directory');

  const manifests = Object.fromEntries(jsonFiles.map((relativePath) => [
    relativePath,
    readJson(root, relativePath),
  ]));
  validateVersions(manifests);
  validateDeclarations(root, manifests);
  validateCommands(root);
  validateSkills(root, manifests['skills-lock.json']);
}

if (require.main === module) {
  if (process.argv.length !== 3) {
    console.error('usage: node scripts/check-artifact.js <root>');
    process.exitCode = 2;
  } else {
    try {
      validateArtifact(process.argv[2]);
      console.log('batuta artifact: ok');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = { validateArtifact };
