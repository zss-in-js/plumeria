#!/usr/bin/env node

const { spawn } = require('child_process');
const process = require('process');
const path = require('path');
const oxlintConfig = path.join(__dirname, '..', 'oxlint.json');

const doubleDashIndex = process.argv.indexOf('--');
let oxlintExtraArgs = [];
let buildCommand = null;
let buildArgs = [];

if (doubleDashIndex !== -1) {
  oxlintExtraArgs = process.argv.slice(2, doubleDashIndex);
  if (doubleDashIndex + 1 < process.argv.length) {
    buildCommand = process.argv[doubleDashIndex + 1];
    buildArgs = process.argv.slice(doubleDashIndex + 2);
  }
} else {
  oxlintExtraArgs = process.argv.slice(2);
}

const oxlintArgs = ['-c', oxlintConfig, '--deny-warnings', ...oxlintExtraArgs];

function handleOxlintError(err) {
  if (err.code === 'ENOENT') {
    console.error('\n✖ oxlint is not installed.');
    console.error('➡︎ plumerialint uses oxlint.');
    console.error('✔ please install oxlint.\n');
    process.exit(1);
  } else {
    console.error('Error running oxlint:', err.message);
    process.exit(1);
  }
}

if (!buildCommand) {
  const child = spawn('oxlint', oxlintArgs, { stdio: 'inherit' });
  child.on('error', handleOxlintError);
  child.on('close', (code) => {
    process.exit(code || 0);
  });
} else {
  let oxlintExited = false;
  let oxlintCode = null;
  let buildExited = false;
  let buildCode = null;
  let aborted = false;

  const oxlintChild = spawn('oxlint', oxlintArgs, { stdio: 'inherit' });

  const fullBuildCommand =
    buildArgs.length > 0
      ? [buildCommand, ...buildArgs].join(' ')
      : buildCommand;

  const buildChild = spawn(fullBuildCommand, {
    stdio: 'inherit',
    shell: true,
  });

  function abort(exitCode, failedSource) {
    if (aborted) return;
    aborted = true;

    if (failedSource === 'lint') {
      console.error(`\n✖ [plumerialint] Linting failed. Aborting build...`);
      try {
        buildChild.kill();
      } catch (e) {}
      process.exit(exitCode || 1);
    } else if (failedSource === 'build') {
      console.error(`\n✖ [plumerialint] Build failed. Aborting lint...`);
      try {
        oxlintChild.kill();
      } catch (e) {}
      process.exit(exitCode || 1);
    }
  }

  oxlintChild.on('error', (err) => {
    handleOxlintError(err);
  });

  buildChild.on('error', (err) => {
    console.error(
      `Error running build command "${buildCommand}":`,
      err.message,
    );
    abort(1, 'build');
  });

  oxlintChild.on('close', (code) => {
    oxlintExited = true;
    oxlintCode = code;
    if (code !== 0) {
      abort(code, 'lint');
    } else if (buildExited) {
      process.exit(buildCode || 0);
    }
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
}
