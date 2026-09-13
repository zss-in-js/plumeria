import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { main, parseArgs } from '../src/cli';
import * as prompt from '../src/prompt';
import * as setup from '../src/setup';

jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));
jest.mock('../src/prompt', () => {
  const actual = jest.requireActual('../src/prompt');
  return {
    ...actual,
    ask: jest.fn(actual.ask),
    terminal: jest.fn(actual.terminal),
  };
});
jest.mock('../src/setup', () => {
  const actual = jest.requireActual('../src/setup');
  return { ...actual, plan: jest.fn(actual.plan) };
});

const mockedSpawnSync = jest.mocked(spawnSync);
const mockedAsk = jest.mocked(prompt.ask);
const mockedTerminal = jest.mocked(prompt.terminal);
const mockedPlan = jest.mocked(setup.plan);

describe('parseArgs', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('asks nothing and writes nothing on --help', () => {
    expect(parseArgs(['--help'])).toBeNull();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('npx @plumeria/init'),
    );
  });

  it('reads the flags that answer a question', () => {
    expect(
      parseArgs(['--physical', '--sizes', '--style-prop', 'sx', '--no-eslint']),
    ).toMatchObject({
      preset: {
        spelling: 'physical',
        sizes: true,
        styleProp: 'sx',
        eslint: false,
      },
    });
  });

  it('reads the bundler it is told to use', () => {
    expect(parseArgs(['--bundler', 'rollup'])?.bundler).toBe('rollup');
  });

  it('refuses a bundler it does not know', () => {
    expect(() => parseArgs(['--bundler', 'parcel'])).toThrow(/unknown bundler/);
  });

  it('refuses --sizes on its own', () => {
    expect(() => parseArgs(['--sizes'])).toThrow(
      /needs --logical or --physical/,
    );
  });

  it('refuses an option it does not know', () => {
    expect(() => parseArgs(['--turbo'])).toThrow(/unknown option/);
  });

  it('refuses a flag whose value is missing', () => {
    expect(() => parseArgs(['--style-prop'])).toThrow(/needs a value/);
  });

  it('reads aliases and the remaining presets', () => {
    expect(
      parseArgs([
        '-y',
        '-d',
        '--logical',
        '--both',
        '--no-install',
        '--cwd',
        '.',
      ]),
    ).toMatchObject({
      yes: true,
      dryRun: true,
      cwd: process.cwd(),
      preset: { spelling: 'both', install: false },
    });
    expect(parseArgs(['--yes', '--dry-run', '--physical'])).toMatchObject({
      yes: true,
      dryRun: true,
      preset: { spelling: 'physical' },
    });
  });

  it('prints the version and rejects a following flag as a value', () => {
    expect(parseArgs(['-v'])).toBeNull();
    expect(parseArgs(['--version'])).toBeNull();
    expect(() => parseArgs(['--cwd', '--yes'])).toThrow(/needs a value/);
  });
});

describe('--style-prop', () => {
  it('takes an identifier', () => {
    expect(parseArgs(['--style-prop', 'sx'])?.preset.styleProp).toBe('sx');
  });

  it('refuses a name TypeScript cannot declare', () => {
    expect(() => parseArgs(['--style-prop', 'foo-bar'])).toThrow(
      /not a valid identifier/,
    );
  });

  it('refuses a name React already handles', () => {
    expect(() => parseArgs(['--style-prop', 'className'])).toThrow(
      /already used by React/,
    );
  });
});

describe('main', () => {
  let dir: string;
  let log: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    const actualPrompt = jest.requireActual('../src/prompt') as typeof prompt;
    const actualSetup = jest.requireActual('../src/setup') as typeof setup;
    mockedAsk.mockImplementation(actualPrompt.ask);
    mockedTerminal.mockImplementation(actualPrompt.terminal);
    mockedPlan.mockImplementation(actualSetup.plan);
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'init-main-')));
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { vite: '1' } }),
    );
    fs.writeFileSync(
      path.join(dir, 'vite.config.js'),
      'export default { plugins: [] };\n',
    );
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedSpawnSync.mockReturnValue({ status: 0 } as never);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('turns usage errors into a status and returns after help', async () => {
    await expect(main(['--unknown'])).resolves.toBe(1);
    await expect(main(['--help'])).resolves.toBe(0);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('unknown option'),
    );
  });

  it('lets an error that is not about usage through', async () => {
    const cwd = jest.spyOn(process, 'cwd').mockImplementation(() => {
      throw new Error('no working directory');
    });
    await expect(main([])).rejects.toThrow('no working directory');
    expect(error).not.toHaveBeenCalled();
    cwd.mockRestore();
  });

  it('shows a dry run without writing', async () => {
    await expect(main(['--cwd', dir, '--yes', '--dry-run'])).resolves.toBe(0);
    expect(fs.existsSync(path.join(dir, 'plumeria.d.ts'))).toBe(false);
  });

  it('writes safe actions and prints manual work', async () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { esbuild: '1' } }),
    );
    fs.rmSync(path.join(dir, 'vite.config.js'));
    await expect(
      main(['--cwd', dir, '--yes', '--no-eslint', '--no-install']),
    ).resolves.toBe(1);
    expect(fs.existsSync(path.join(dir, 'plumeria.d.ts'))).toBe(true);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Left to you'));
  });

  it('returns the installer status, including a missing status', async () => {
    mockedSpawnSync.mockReturnValueOnce({ status: 7 } as never);
    await expect(main(['--cwd', dir, '--yes'])).resolves.toBe(7);
    mockedSpawnSync.mockReturnValueOnce({ status: null } as never);
    await expect(main(['--cwd', dir, '--yes'])).resolves.toBe(1);
  });

  it('finishes after a successful install with no manual work', async () => {
    await expect(main(['--cwd', dir, '--yes'])).resolves.toBe(0);
    expect(mockedSpawnSync).toHaveBeenCalled();
  });

  it('handles every interactive confirmation form and closes the terminal', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    });
    const close = jest.fn();
    const question = jest.fn();
    mockedTerminal.mockReturnValue({ close, question });
    mockedAsk.mockResolvedValue(setup.DEFAULT_ANSWERS);
    mockedPlan.mockReturnValue([]);
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}');

    try {
      for (const [answer, status] of [
        ['n', 0],
        ['', 0],
        ['y', 0],
        ['yes', 0],
      ] as const) {
        question.mockResolvedValueOnce(answer);
        await expect(main(['--cwd', dir])).resolves.toBe(status);
      }
    } finally {
      if (descriptor) Object.defineProperty(process.stdin, 'isTTY', descriptor);
      else Reflect.deleteProperty(process.stdin, 'isTTY');
    }

    expect(prompt.ask).toHaveBeenCalledTimes(4);
    expect(close).toHaveBeenCalledTimes(4);
  });
});
