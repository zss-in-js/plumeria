import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const GUARD_ENV = 'PLUMERIA_LINT_GUARD';

const BASE_CONFIG = path.join(__dirname, '..', 'oxlint.json');

type Spelling = boolean | { sizes?: boolean } | undefined;

interface LintOptions {
  withoutLogicalProperties?: Spelling;
  withoutPhysicalProperties?: Spelling;
  styleProp?: string;
}

export interface LintOverrides {
  rules?: Record<string, unknown>;
  settings?: { plumeria: { styleProp: string } };
}

function spellingRule(spelling: Spelling): unknown {
  if (!spelling) return undefined;
  return typeof spelling === 'object' && spelling.sizes
    ? ['error', { sizes: true }]
    : 'error';
}

export function lintOverrides(options: LintOptions): LintOverrides {
  const overrides: LintOverrides = {};
  const rules: Record<string, unknown> = {};
  const logical = spellingRule(options.withoutLogicalProperties);
  const physical = spellingRule(options.withoutPhysicalProperties);
  if (logical) rules['@plumeria/no-logical-properties'] = logical;
  if (physical) rules['@plumeria/no-physical-properties'] = physical;
  if (logical || physical) overrides.rules = rules;
  if (options.styleProp) {
    overrides.settings = { plumeria: { styleProp: options.styleProp } };
  }
  return overrides;
}

function lintConfig(overrides: LintOverrides): string {
  if (!overrides.rules && !overrides.settings) return BASE_CONFIG;
  const file = path.join(os.tmpdir(), `plumeria-oxlint-${process.pid}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify({ extends: [BASE_CONFIG], ...overrides }),
  );
  return file;
}

export function startLintGuard(overrides: LintOverrides = {}): boolean {
  if (process.env[GUARD_ENV]) return false;
  process.env[GUARD_ENV] = '1';

  const config = lintConfig(overrides);

  const child = spawn(
    process.execPath,
    [
      path.join(
        path.dirname(require.resolve('oxlint/package.json')),
        'bin',
        'oxlint',
      ),
      '-c',
      config,
      '--deny-warnings',
      '--no-error-on-unmatched-pattern',
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
    if (config !== BASE_CONFIG) fs.rmSync(config, { force: true });
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
