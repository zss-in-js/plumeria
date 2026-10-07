import { startLintGuard } from '@plumeria/eslint-plugin/guard';

export function isNextBuild(argv: string[]): boolean {
  return (
    /[\\/]next[\\/]/.test(argv[1] ?? '') && argv.slice(2).includes('build')
  );
}

export function startNextLintGuard(
  rules: Record<string, unknown> = {},
  argv: string[] = process.argv,
): boolean {
  if (!isNextBuild(argv)) return false;
  return startLintGuard(rules);
}
