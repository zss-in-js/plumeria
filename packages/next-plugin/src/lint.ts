import * as path from 'path';
import { startLintGuard } from '@plumeria/eslint-plugin/guard';

export function startNextLintGuard(
  rules: Record<string, unknown> = {},
  argv: string[] = process.argv,
): boolean {
  const [, bin = '', ...args] = argv;
  if (path.basename(bin) !== 'next' || !args.includes('build')) return false;
  return startLintGuard(rules);
}
