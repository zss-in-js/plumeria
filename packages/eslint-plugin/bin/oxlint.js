#!/usr/bin/env node

const { spawn } = require('child_process');
const process = require('process');
const path = require('path');
const fs = require('fs');
const oxlintConfig = path.join(__dirname, '..', 'oxlint.json');
const oxlintBin = path.join(
  path.dirname(require.resolve('oxlint/package.json')),
  'bin',
  'oxlint',
);

const { cliOverrides } = require('../dist/cli.js');
const { lintConfig, lowerPriority } = require('../dist/guard.js');

const doubleDashIndex = process.argv.indexOf('--');
let cliArgs = [];
let buildCommand = null;
let buildArgs = [];

if (doubleDashIndex !== -1) {
  cliArgs = process.argv.slice(2, doubleDashIndex);
  if (doubleDashIndex + 1 < process.argv.length) {
    buildCommand = process.argv[doubleDashIndex + 1];
    buildArgs = process.argv.slice(doubleDashIndex + 2);
  }
} else {
  cliArgs = process.argv.slice(2);
}

async function startOxlint() {
  const { overrides, rest } = await cliOverrides(cliArgs, process.cwd());
  const config = lintConfig(overrides);
  const child = spawn(
    process.execPath,
    [
      oxlintBin,
      '-c',
      config,
      '--deny-warnings',
      '--no-error-on-unmatched-pattern',
      ...(rest.some((arg) => arg.startsWith('--threads'))
        ? []
        : ['--threads=2']),
      ...rest,
    ],
    { stdio: 'inherit' },
  );
  lowerPriority(child.pid);
  if (config !== oxlintConfig) {
    child.on('close', () => fs.rmSync(config, { force: true }));
  }
  return child;
}

function handleOxlintError(err) {
  console.error('Error running oxlint:', err.message);
  process.exit(1);
}

function fail(err) {
  console.error(`✖ [plumeria-lint] ${err.message}`);
  process.exit(1);
}

if (!buildCommand) {
  startOxlint().then((child) => {
    child.on('error', handleOxlintError);
    child.on('close', (code) => {
      process.exit(code || 0);
    });
  }, fail);
} else {
  let oxlintExited = false;
  let oxlintCode = null;
  let buildExited = false;
  let buildCode = null;
  let aborted = false;
  let oxlintChild = null;

  const fullBuildCommand =
    buildArgs.length > 0
      ? [buildCommand, ...buildArgs].join(' ')
      : buildCommand;

  const buildChild = spawn(fullBuildCommand, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PLUMERIA_LINT_GUARD: '1' },
  });

  function abort(exitCode, failedSource) {
    if (aborted) return;
    aborted = true;

    if (failedSource === 'lint') {
      console.error(`\n✖ [plumeria-lint] Linting failed. Aborting build...`);
      try {
        buildChild.kill();
      } catch (e) {}
      process.exit(exitCode || 1);
    } else if (failedSource === 'build') {
      console.error(`\n✖ [plumeria-lint] Build failed. Aborting lint...`);
      try {
        if (oxlintChild) oxlintChild.kill();
      } catch (e) {}
      process.exit(exitCode || 1);
    }
  }

  buildChild.on('error', (err) => {
    console.error(
      `Error running build command "${buildCommand}":`,
      err.message,
    );
    abort(1, 'build');
  });

  buildChild.on('close', (code) => {
    buildExited = true;
    buildCode = code;
    if (code !== 0) {
      abort(code, 'build');
    } else if (oxlintExited) {
      process.exit(oxlintCode || 0);
    }
  });

  startOxlint().then((child) => {
    if (aborted) {
      child.kill();
      return;
    }
    oxlintChild = child;
    child.on('error', handleOxlintError);
    child.on('close', (code) => {
      oxlintExited = true;
      oxlintCode = code;
      if (code !== 0) {
        abort(code, 'lint');
      } else if (buildExited) {
        process.exit(buildCode || 0);
      }
    });
  }, fail);
}
