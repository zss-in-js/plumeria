#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { styleText } from 'util';

const checkMark = styleText('greenBright', '✓');

try {
  const typecheck = process.argv.includes('--type-check');
  if (typecheck) {
    execSync('npx tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }

  const compilerPath = findCompilerPath();

  const argv = process.argv.includes('--log') ? ' --log' : '';
  execSync(`npx tsx ${path.join(compilerPath, 'src/index.ts')}${argv}`, {
    stdio: 'inherit',
    cwd: compilerPath,
  });

  const completed = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${completed}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

function findCompilerPath() {
  try {
    const compilerMain = require.resolve('@plumeria/compiler');
    return path.dirname(compilerMain);
  } catch (error) {
    throw new Error('Could not resolve @plumeria/compiler package');
  }
}
