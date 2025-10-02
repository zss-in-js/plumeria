#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const { styleText } = require('util');
const { enableCompileCache } = require('node:module');

enableCompileCache();

const { register } = require('rscute/register');

register();

try {
  const checkMark = styleText('greenBright', '✓');
  const typecheck = process.argv.includes('--type-check');

  if (typecheck) {
    execSync('tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }

  require(path.resolve(__dirname, '../dist/index.js'));

  const compilation = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${compilation}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
