import { spawn } from 'child_process';
import * as path from 'path';

export const GUARD_ENV = 'PLUMERIA_LINT_GUARD';

export function startLintGuard(): boolean {
  if (process.env[GUARD_ENV]) return false;
  process.env[GUARD_ENV] = '1';

  const child = spawn(
    process.execPath,
    [
      path.join(
        path.dirname(require.resolve('oxlint/package.json')),
        'bin',
        'oxlint',
      ),
      '-c',
      path.join(__dirname, '..', 'oxlint.json'),
      '--deny-warnings',
    ],
    { stdio: 'inherit' },
  );

  const exit = process.exit.bind(process);
  let lintCode: number | null = null;
  let pendingCode: number | undefined | null = null;

  child.on('error', (error) => {
    console.error(`\n✖ [plumeria] Could not run oxlint: ${error.message}`);
    exit(1);
  });

  child.on('close', (code) => {
    lintCode = code ?? 1;
    if (lintCode !== 0) {
      console.error('\n✖ [plumeria] Linting failed. Aborting build...');
      return exit(lintCode);
    }
    if (pendingCode !== null) exit(pendingCode);
  });

  process.exit = ((code?: number) => {
    if (lintCode !== null) return exit(code);
    pendingCode = code;
  }) as typeof process.exit;

  return true;
}
