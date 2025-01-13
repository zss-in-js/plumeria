#!/usr/bin/env node

import { execSync } from 'child_process';
import { join } from 'path';
import { styleText } from 'util';

const checkMark = styleText('greenBright', '✓');

try {
  const typecheck = process.argv.includes('--type-check');
  if (typecheck)
    execSync('npx tsc --noEmit --incremental false', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  const argv = process.argv.includes('--log') ? ' --log' : '';
  execSync('npx tsx compiler/src/index.ts' + argv, {
    stdio: 'inherit',
    cwd: join(process.cwd(), 'node_modules/@plumeria'),
  });
  const completed = typecheck ? 'Type-check completed' : '';
  console.log(` ${checkMark} Compiled... ${completed}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
