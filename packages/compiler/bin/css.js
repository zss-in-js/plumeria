#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { styleText } = require('util');

try {
  const checkMark = styleText('greenBright', '✓');
  const isPnpm = fs.existsSync(path.join(process.cwd(), 'node_modules/.pnpm'));
  const typecheck = process.argv.includes('--type-check');

  if (typecheck)
    execSync('tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

  const plumeriaPath = isPnpm
    ? findPnpmPath('@plumeria+compiler@', 'node_modules/@plumeria')
    : path.join(process.cwd(), 'node_modules/@plumeria');

  const a1 = process.argv.includes('--view') ? '--view' : '';
  const a2 = process.argv.includes('--paths') ? '--paths' : '';
  const argv = [a1, a2].join(' ');

  execSync(`node -r rscute compiler/dist/index.js ` + argv, {
    stdio: 'inherit',
    cwd: plumeriaPath,
  });

  const compilation = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${compilation}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

function findPnpmPath(arg1, arg2) {
  const pnpmPath = path.join(process.cwd(), 'node_modules/.pnpm');
  const pnpmDir = fs.readdirSync(pnpmPath).find((dir) => dir.startsWith(arg1));

  if (!pnpmDir) {
    throw new Error(`Could not find ${arg1} package in pnpm directory`);
  }

  return path.join(pnpmPath, pnpmDir, arg2);
}
