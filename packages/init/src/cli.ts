import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BUNDLERS, detect } from './detect';
import { ask, terminal } from './prompt';
import { DEFAULT_ANSWERS, assertStyleProp, plan } from './setup';
import { style } from './style';
import type { Bundler } from './detect';
import type { Asker } from './prompt';
import type { Action, Answers } from './setup';

const { version } = require('../package.json') as { version: string };

const USAGE = `@plumeria/init — set up Plumeria in this project

Usage
  npx @plumeria/init

It reads the project, asks what it cannot detect, then installs the packages
and writes the configs. Nothing is written before the plan is shown.

Options
  -y, --yes            accept every default, ask nothing
  -d, --dry-run        show the plan without writing
      --bundler <name> ${BUNDLERS.join(', ')}
      --style-prop <p> the JSX prop that carries styles (default classStyle)
      --logical        this project writes logical properties
      --physical       this project writes physical properties
      --sizes          extend the spelling policy to the size axis
      --no-eslint      leave ESLint and the plumerialint guard out
      --no-install     write the configs, print the install command
      --cwd <dir>      run against another directory
  -h, --help           show this message
  -v, --version        show the version

The spelling answer reaches both sides: the bundler plugin rejects the
counterpart at compile time, and ESLint reports it while you type.`;

class UsageError extends Error {}

interface Options {
  cwd: string;
  bundler: Bundler | undefined;
  preset: Partial<Answers>;
  yes: boolean;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): Options | null {
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(USAGE);
    return null;
  }
  if (argv.includes('-v') || argv.includes('--version')) {
    console.log(version);
    return null;
  }

  const options: Options = {
    cwd: process.cwd(),
    bundler: undefined,
    preset: {},
    yes: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-y':
      case '--yes':
        options.yes = true;
        break;
      case '-d':
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--logical':
        options.preset.spelling = 'logical';
        break;
      case '--physical':
        options.preset.spelling = 'physical';
        break;
      case '--both':
        options.preset.spelling = 'both';
        break;
      case '--sizes':
        options.preset.sizes = true;
        break;
      case '--no-eslint':
        options.preset.eslint = false;
        break;
      case '--no-install':
        options.preset.install = false;
        break;
      case '--bundler':
        options.bundler = read(argv, ++i, '--bundler') as Bundler;
        break;
      case '--style-prop':
        options.preset.styleProp = styleProp(read(argv, ++i, '--style-prop'));
        break;
      case '--cwd':
        options.cwd = path.resolve(read(argv, ++i, '--cwd'));
        break;
      default:
        throw new UsageError(`unknown option "${arg}"`);
    }
  }

  if (options.bundler && !BUNDLERS.includes(options.bundler)) {
    throw new UsageError(
      `unknown bundler "${options.bundler}". Available: ${BUNDLERS.join(', ')}`,
    );
  }
  if (options.preset.sizes && options.preset.spelling === undefined) {
    throw new UsageError('--sizes needs --logical or --physical');
  }

  return options;
}

function styleProp(value: string): string {
  try {
    return assertStyleProp(value);
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
}

function read(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('-'))
    throw new UsageError(`${flag} needs a value`);
  return value;
}

const MARKS: Record<Action['kind'], string> = {
  install: '➡︎',
  write: '+',
  patch: '~',
  manual: '!',
  skip: '·',
};

const PAINT: Record<Action['kind'], (text: string) => string> = {
  install: style.install,
  write: style.write,
  patch: style.patch,
  manual: style.manual,
  skip: style.skip,
};

function show(actions: Action[]): void {
  const label = Math.max(...actions.map((action) => action.label.length));
  const named = actions.filter((action) => action.kind !== 'install');
  const file = Math.max(0, ...named.map((action) => action.file.length));

  const pad = (text: string, width: number) =>
    ' '.repeat(Math.max(0, width - text.length));

  for (const action of actions) {
    const head =
      PAINT[action.kind](`${MARKS[action.kind]} ${action.label}`) +
      pad(action.label, label);
    const target =
      action.kind === 'install'
        ? ''
        : `  ${style.strong(action.file)}${pad(action.file, file)}`;
    console.log(`  ${head}${target}  ${action.note}`);
  }
}

function apply(root: string, action: Action): void {
  if (action.kind !== 'write' && action.kind !== 'patch') return;
  const file = path.join(root, action.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, action.contents);
}

function install(root: string, action: Action): number {
  if (action.kind !== 'install') return 0;
  const [command, ...args] = action.command.split(' ');
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

export async function main(argv: string[]): Promise<number> {
  let options: Options | null;

  try {
    options = parseArgs(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`${style.failure('✖')} ${error.message}\n`);
    console.error(USAGE);
    return 1;
  }

  if (!options) return 0;

  const detected = detect(options.cwd, options.bundler);
  const found = [
    detected.bundler,
    detected.packageManager,
    detected.typescript ? 'typescript' : 'javascript',
  ]
    .map((name) => style.strong(name))
    .join('  ');
  console.log(`\n${style.ok('✔')} detected  ${found}`);

  const interactive = !options.yes && process.stdin.isTTY === true;
  let asker: Asker | undefined;
  let answers: Answers;

  try {
    if (interactive) {
      asker = terminal();
      answers = await ask(asker, options.preset);
    } else {
      answers = { ...DEFAULT_ANSWERS, ...options.preset };
    }

    const actions = plan(detected, answers);
    console.log('');
    show(actions);

    if (options.dryRun) {
      console.log(`\n${style.faint('Run without --dry-run to apply.')}`);
      return 0;
    }
    if (interactive && asker) {
      const go = (await asker.question('\nApply? (Y/n) ')).trim().toLowerCase();
      if (go !== '' && go !== 'y' && go !== 'yes') {
        console.log(style.faint('Nothing was written.'));
        return 0;
      }
    }

    for (const action of actions) apply(detected.root, action);

    const wanted = actions.find((action) => action.kind === 'install');
    if (wanted && answers.install) {
      console.log('');
      const status = install(detected.root, wanted);
      if (status !== 0) {
        console.error(
          `\n${style.failure('✖')} ${wanted.command} failed. Run it yourself and try again.`,
        );
        return status;
      }
    } else if (wanted) {
      console.log(`\n${style.install('➡︎')} run: ${wanted.command}`);
    }

    console.log(`\n${style.ok('✔')} Plumeria is set up.`);

    const manual = actions.filter((action) => action.kind === 'manual');
    if (manual.length === 0) return 0;

    console.log(
      `\n${style.manual('Left to you — these could not be written safely:')}\n`,
    );
    for (const action of manual) {
      if (action.kind !== 'manual') continue;
      console.log(`  ${style.strong(action.file)}  ${action.note}`);
      for (const line of action.snippet.split('\n'))
        console.log(style.faint(`    ${line}`));
      console.log('');
    }
    return 1;
  } finally {
    asker?.close();
  }
}
