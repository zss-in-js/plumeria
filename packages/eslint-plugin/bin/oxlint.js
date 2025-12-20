#!/usr/bin/env node

const { spawn } = require('child_process');
const process = require('process');
const path = require('path');
const oxlint = path.join(__dirname, '..', 'oxlint.json');

const args = ['-c', oxlint, '--deny-warnings', ...process.argv.slice(2)];

const child = spawn('oxlint', args, {
  stdio: 'inherit',
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n✖ oxlint is not installed.');
    console.error('➡︎ plumerialint uses oxlint.');
    console.error('✔ please install oxlint.\n');
    process.exit(1);
  } else {
    console.error('Error running oxlint:', err.message);
    process.exit(1);
  }
});

child.on('close', (code) => {
  process.exit(code || 0);
});
