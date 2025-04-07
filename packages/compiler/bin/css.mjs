#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { styleText } from 'util';

function findPnpmPath(arg1, arg2) {
  const pnpmPath = path.join(process.cwd(), 'node_modules/.pnpm');
  const pnpmDir = fs.readdirSync(pnpmPath).find((dir) => dir.startsWith(arg1));

  if (!pnpmDir) {
    throw new Error(`Could not find ${arg1} package in pnpm directory`);
  }

  return path.join(pnpmPath, pnpmDir, arg2);
}

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

  const rscutePath = isPnpm
    ? findPnpmPath('rscute@', 'node_modules/rscute/dist/execute.js')
    : path.join(process.cwd(), 'node_modules/rscute/dist/execute.js');

  const argv = process.argv.includes('--log') ? ' --log' : '';
  execSync(`node ${rscutePath} compiler/dist/index.js` + argv, {
    stdio: 'inherit',
    cwd: plumeriaPath,
  });

  const compilation = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${compilation}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
