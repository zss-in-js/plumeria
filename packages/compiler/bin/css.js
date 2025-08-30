#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const { styleText } = require('util');

try {
  const checkMark = styleText('greenBright', '✓');
  const typecheck = process.argv.includes('--type-check');

  if (typecheck) {
    execSync('tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }

  const a1 = process.argv.includes('--view') ? '--view' : '';
  const a2 = process.argv.includes('--paths') ? '--paths' : '';
  const argv = [a1, a2].join(' ');

  const indexPath = path.resolve(__dirname, '../dist/index.js');

  execSync(`node -r rscute ${indexPath} ` + argv, {
    stdio: 'inherit',
  });

  const compilation = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${compilation}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
