#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { styleText } from 'util';
import fs from 'fs';

try {
  process.env.PATH = `${path.resolve(process.cwd(), 'node_modules', '.bin')}:${process.env.PATH}`;
  const checkMark = styleText('greenBright', '✓');
  const isPnpm = fs.existsSync(path.join(process.cwd(), 'node_modules/.pnpm'));
  const typecheck = process.argv.includes('--type-check');

  if (typecheck)
    execSync('tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

  const plumeriaPath = isPnpm
    ? findPnpmPlumeriaPath()
    : path.join(process.cwd(), 'node_modules/@plumeria');

  const argv = process.argv.includes('--log') ? ' --log' : '';
  execSync('rscute compiler/src/index.ts' + argv, {
    stdio: 'inherit',
    cwd: plumeriaPath,
  });

  const compilation = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${compilation}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

function findPnpmPlumeriaPath() {
  const pnpmPath = path.join(process.cwd(), 'node_modules/.pnpm');
  const plumeriaDir = fs
    .readdirSync(pnpmPath)
    .find((dir) => dir.startsWith('@plumeria+compiler@'));

  if (!plumeriaDir) {
    throw new Error('Could not find @plumeria package in pnpm directory');
  }

  return path.join(pnpmPath, plumeriaDir, 'node_modules/@plumeria');
}
