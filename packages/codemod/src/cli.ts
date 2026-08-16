import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ESLint } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { renameProp } from './transforms/rename-prop';
import { adoptStyles } from './transforms/adopt-styles';
import { releaseStyles } from './transforms/release-styles';
import { plan, write, formatReports } from './migrate';
import { formatReleaseReports, planRelease, writeRelease } from './release';
import type { ModuleMap } from './transforms/adopt-styles';
import type { ReleaseModule } from './transforms/release-styles';
import type { Linter } from 'eslint';

const { version } = require('../package.json') as { version: string };

const TRANSFORMS = ['rename-prop', 'migrate'] as const;

const SOURCES = ['css-modules', 'plumeria'] as const;

const SOURCE_FILES = '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}';

const IGNORES = [
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/coverage/**',
];

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// Renaming onto one of these would collide with a prop React already handles.
const RESERVED = new Set(['className', 'key', 'ref', 'children', 'style']);

const USAGE = `plumeria-codemod — codemods for migrating Plumeria APIs

Usage
  npx @plumeria/codemod rename-prop <from> <to> [paths...]
  npx @plumeria/codemod migrate --from css-modules [paths...]
  npx @plumeria/codemod migrate --from plumeria [paths...]

Options
  -d, --dry-run    report what would change without writing
      --no-types   leave TypeScript declarations untouched (rename-prop)
      --from       what to migrate from (migrate)
  -h, --help       show this message
  -v, --version    show the version

Examples
  npx @plumeria/codemod rename-prop classStyle sx
  npx @plumeria/codemod rename-prop classStyle sx src app --dry-run
  npx @plumeria/codemod migrate --from css-modules
  npx @plumeria/codemod migrate --from plumeria --dry-run

Paths default to the current directory. After the rewrite, point the toolchain
at the new name with \`styleProp\` on your bundler plugin, and with
\`settings: { plumeria: { styleProp: '<to>' } }\` in your ESLint config.`;

class UsageError extends Error {}

interface RenameOptions {
  transform: 'rename-prop';
  from: string;
  to: string;
  targets: string[];
  dryRun: boolean;
  includeTypes: boolean;
}

interface MigrateOptions {
  transform: 'migrate';
  source: (typeof SOURCES)[number];
  targets: string[];
  dryRun: boolean;
}

type Options = RenameOptions | MigrateOptions;

function parseArgs(argv: string[]): Options | null {
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    console.log(USAGE);
    return null;
  }
  if (argv.includes('-v') || argv.includes('--version')) {
    console.log(version);
    return null;
  }

  const positional: string[] = [];
  let dryRun = false;
  let includeTypes = true;
  let source: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-d':
      case '--dry-run':
        dryRun = true;
        break;
      case '--no-types':
        includeTypes = false;
        break;
      case '--from':
        source = argv[++i];
        break;
      default:
        if (arg.startsWith('--from=')) {
          source = arg.slice('--from='.length);
          break;
        }
        if (arg.startsWith('-'))
          throw new UsageError(`unknown option "${arg}"`);
        positional.push(arg);
    }
  }

  const [transform, from, to, ...targets] = positional;

  if (!TRANSFORMS.includes(transform as (typeof TRANSFORMS)[number])) {
    throw new UsageError(
      `unknown transform "${transform}". Available: ${TRANSFORMS.join(', ')}`,
    );
  }

  if (transform === 'migrate') {
    if (!source) {
      throw new UsageError(
        `migrate needs --from. Available: ${SOURCES.join(', ')}`,
      );
    }
    if (!SOURCES.includes(source as (typeof SOURCES)[number])) {
      throw new UsageError(
        `unknown source "${source}". Available: ${SOURCES.join(', ')}`,
      );
    }
    return {
      transform: 'migrate',
      source: source as (typeof SOURCES)[number],
      targets: positional.slice(1).length > 0 ? positional.slice(1) : ['.'],
      dryRun,
    };
  }
  if (!from || !to) {
    throw new UsageError('rename-prop needs both <from> and <to>');
  }
  if (!IDENTIFIER.test(to)) {
    throw new UsageError(`"${to}" is not a valid identifier`);
  }
  if (from === to) {
    throw new UsageError(`<from> and <to> are both "${from}"`);
  }
  if (RESERVED.has(to)) {
    throw new UsageError(`"${to}" is already used by React`);
  }

  return {
    transform: 'rename-prop',
    from,
    to,
    targets: targets.length > 0 ? targets : ['.'],
    dryRun,
    includeTypes,
  };
}

function buildConfig(options: RenameOptions): Linter.Config[] {
  const { from, to, includeTypes } = options;

  return [
    { ignores: IGNORES },
    {
      files: [SOURCE_FILES],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: {
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: { codemod: { rules: { 'rename-prop': renameProp } } },
      rules: { 'codemod/rename-prop': ['error', { from, to, includeTypes }] },
    },
  ];
}

function warnIfDirty(): void {
  try {
    const status = execFileSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (status.trim()) {
      console.warn(
        '! git working tree is not clean. Commit first so the rewrite can be reverted.\n',
      );
    }
  } catch {
    // ignore
  }
}

export async function main(argv: string[]): Promise<number> {
  let options: Options | null;

  try {
    options = parseArgs(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`✖ ${error.message}\n`);
    console.error(USAGE);
    return 1;
  }

  if (!options) return 0;

  if (options.transform === 'migrate') {
    return options.source === 'plumeria'
      ? migrateFromPlumeria(options)
      : migrateFromCssModules(options);
  }

  const { from, to, targets, dryRun } = options;
  const baseConfig = {
    overrideConfigFile: true as const,
    overrideConfig: buildConfig(options),
    errorOnUnmatchedPattern: false,
  };

  const results = await new ESLint(baseConfig).lintFiles(targets);

  const cwd = process.cwd();
  const relative = (filePath: string) => path.relative(cwd, filePath) || '.';

  const changes: { file: string; count: number }[] = [];
  const manual: string[] = [];
  const unparsed: string[] = [];
  let total = 0;

  for (const result of results) {
    let count = 0;
    for (const message of result.messages) {
      if (message.fatal) {
        unparsed.push(`${relative(result.filePath)}: ${message.message}`);
      } else if (message.fix) {
        count++;
      } else {
        manual.push(
          `${relative(result.filePath)}:${message.line}:${message.column}`,
        );
      }
    }
    if (count > 0) {
      changes.push({ file: relative(result.filePath), count });
      total += count;
    }
  }

  if (total === 0 && manual.length === 0) {
    console.log(`No "${from}" found.`);
    return unparsed.length > 0 ? report(unparsed) : 0;
  }

  if (total === 0) {
    console.log(`Every remaining "${from}" needs a manual rename.`);
  } else {
    for (const { file, count } of changes) {
      console.log(`  ${file}  ${count}`);
    }

    if (dryRun) {
      console.log(
        `\n${total} occurrence(s) in ${changes.length} file(s) would become "${to}".`,
      );
      console.log('Run without --dry-run to apply.');
    } else {
      warnIfDirty();
      const applied = await new ESLint({ ...baseConfig, fix: true }).lintFiles(
        targets,
      );
      await ESLint.outputFixes(applied);
      console.log(
        `\n✔ renamed ${total} occurrence(s) of "${from}" to "${to}" in ${changes.length} file(s).`,
      );
    }
  }

  if (manual.length > 0) {
    console.log(
      `\n${manual.length} occurrence(s) need a manual rename — "${from}" is bound to a local name there:`,
    );
    for (const location of manual) console.log(`  ${location}`);
  }

  return unparsed.length > 0 ? report(unparsed) : 0;
}

function report(unparsed: string[]): number {
  console.error(`\n✖ ${unparsed.length} file(s) could not be parsed:`);
  for (const failure of unparsed) console.error(`  ${failure}`);
  return 1;
}

function migrateConfig(modules: Record<string, ModuleMap>): Linter.Config[] {
  return [
    { ignores: IGNORES },
    {
      files: [SOURCE_FILES],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: {
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
      rules: { 'codemod/adopt-styles': ['error', { modules }] },
    },
  ];
}

async function migrateFromCssModules(options: MigrateOptions): Promise<number> {
  const { targets, dryRun } = options;
  const cwd = process.cwd();
  const relative = (filePath: string) => path.relative(cwd, filePath) || '.';

  const { stylesheets, modules } = plan(targets);

  if (stylesheets.length === 0) {
    console.log('No *.module.css found.');
    return 0;
  }

  for (const sheet of stylesheets) {
    console.log(`  ${relative(sheet.source)}  ->  ${relative(sheet.target)}`);
  }

  const config = {
    overrideConfigFile: true as const,
    overrideConfig: migrateConfig(modules),
    errorOnUnmatchedPattern: false,
  };

  if (dryRun) {
    const results = await new ESLint(config).lintFiles(targets);
    const touched = results.filter((r) => r.messages.length > 0);
    console.log(
      `\n${stylesheets.length} stylesheet(s) would be converted, ${touched.length} consumer(s) rewritten.`,
    );
    console.log('Run without --dry-run to apply.');
  } else {
    warnIfDirty();
    write(targets);
    const applied = await new ESLint({ ...config, fix: true }).lintFiles(
      targets,
    );
    await ESLint.outputFixes(applied);
    const touched = applied.filter((r) => r.output !== undefined);
    console.log(
      `\n✔ converted ${stylesheets.length} stylesheet(s) and rewrote ${touched.length} consumer(s).`,
    );
  }

  const lines = formatReports(stylesheets, cwd);
  if (lines.length === 0) return 0;

  console.log('\nLeft in place — these rules were not converted:\n');
  for (const line of lines) console.log(line);
  return 1;
}

function releaseConfig(
  modules: Record<string, ReleaseModule>,
  themes: Record<string, string[]>,
  animations: Record<string, string[]>,
): Linter.Config[] {
  return [
    { ignores: IGNORES },
    {
      files: [SOURCE_FILES],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: {
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: { codemod: { rules: { 'release-styles': releaseStyles } } },
      rules: {
        'codemod/release-styles': ['error', { modules, themes, animations }],
      },
    },
  ];
}

async function migrateFromPlumeria(options: MigrateOptions): Promise<number> {
  const { targets, dryRun } = options;
  const cwd = process.cwd();
  const relative = (filePath: string) => path.relative(cwd, filePath) || '.';
  const planned = planRelease(targets);

  if (
    planned.stylesheets.length === 0 &&
    Object.keys(planned.themes).length === 0 &&
    Object.keys(planned.animations).length === 0
  ) {
    console.log('No Plumeria styles found.');
    return 0;
  }

  for (const sheet of planned.stylesheets) {
    console.log(`  ${relative(sheet.source)}  ->  ${relative(sheet.target)}`);
  }
  if (planned.global) {
    console.log(`  global styles  ->  ${relative(planned.global.target)}`);
  }

  const config = {
    overrideConfigFile: true as const,
    overrideConfig: releaseConfig(
      planned.modules,
      planned.themes,
      planned.animations,
    ),
    errorOnUnmatchedPattern: false,
  };
  const preview = await new ESLint(config).lintFiles(targets);
  const touched = preview.filter((result) =>
    result.messages.some((message) => message.fix),
  );

  if (dryRun) {
    console.log(
      `\n${Object.keys(planned.modules).length} style module(s) would be exported, ${touched.length} source file(s) rewritten.`,
    );
    console.log('Run without --dry-run to apply.');
  } else {
    warnIfDirty();
    writeRelease(planned);
    const applied = await new ESLint({ ...config, fix: true }).lintFiles(
      targets,
    );
    await ESLint.outputFixes(applied);
    console.log(
      `\n✔ exported ${Object.keys(planned.modules).length} style module(s) and rewrote ${touched.length} source file(s).`,
    );
  }

  const lines = formatReleaseReports(planned.stylesheets, cwd);
  if (lines.length === 0) return 0;
  console.log('\nLeft in Plumeria — these styles were not exported:\n');
  for (const line of lines) console.log(line);
  return 1;
}
