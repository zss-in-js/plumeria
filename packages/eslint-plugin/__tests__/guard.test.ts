import { EventEmitter } from 'events';

const spawn = jest.fn();
jest.mock('child_process', () => ({
  spawn: (...args: unknown[]) => spawn(...args),
}));

const setPriority = jest.fn();
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  setPriority: (...args: unknown[]) => setPriority(...args),
}));

import * as fs from 'fs';
import * as os from 'os';
import { lintOverrides, lowerPriority, startLintGuard } from '../src/guard';

describe('lintOverrides', () => {
  it('turns each spelling option into its rule', () => {
    expect(lintOverrides({})).toEqual({});
    expect(
      lintOverrides({
        withoutLogicalProperties: true,
        withoutPhysicalProperties: false,
      }),
    ).toEqual({ rules: { '@plumeria/no-logical-properties': 'error' } });
    expect(
      lintOverrides({ withoutPhysicalProperties: { sizes: true } }),
    ).toEqual({
      rules: {
        '@plumeria/no-physical-properties': ['error', { sizes: true }],
      },
    });
    expect(lintOverrides({ withoutLogicalProperties: {} })).toEqual({
      rules: { '@plumeria/no-logical-properties': 'error' },
    });
  });

  it('passes the styling prop to the rules as a setting', () => {
    expect(lintOverrides({ styleProp: 'sx' })).toEqual({
      settings: { plumeria: { styleProp: 'sx' } },
    });
  });
});

describe('lowerPriority', () => {
  beforeEach(() => setPriority.mockReset());

  it('lowers the process to the lowest priority', () => {
    expect(lowerPriority(42)).toBe(true);
    expect(setPriority).toHaveBeenCalledWith(
      42,
      os.constants.priority.PRIORITY_LOW,
    );
  });

  it('skips a process that did not start', () => {
    expect(lowerPriority(undefined)).toBe(false);
    expect(setPriority).not.toHaveBeenCalled();
  });

  it('leaves the priority alone when the process is gone', () => {
    setPriority.mockImplementation(() => {
      throw new Error('ESRCH');
    });
    expect(lowerPriority(42)).toBe(false);
  });
});

describe('startLintGuard', () => {
  const realExit = process.exit;
  let exit: jest.Mock;
  let child: EventEmitter;

  beforeEach(() => {
    delete process.env.PLUMERIA_LINT_GUARD;
    exit = jest.fn();
    process.exit = exit as unknown as typeof process.exit;
    child = new EventEmitter();
    spawn.mockReset().mockReturnValue(child);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exit = realExit;
    delete process.env.PLUMERIA_LINT_GUARD;
    jest.restoreAllMocks();
  });

  it('does not lint when a guard is already running', () => {
    process.env.PLUMERIA_LINT_GUARD = '1';
    expect(startLintGuard()).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('starts oxlint once with the plumeria config', () => {
    expect(startLintGuard()).toBe(true);
    expect(startLintGuard()).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args] = spawn.mock.calls[0];
    expect(args[0]).toMatch(/oxlint[\\/]bin[\\/]oxlint$/);
    expect(args.slice(1)).toEqual([
      '-c',
      expect.stringMatching(/eslint-plugin[\\/]oxlint\.json$/),
      '--deny-warnings',
      '--no-error-on-unmatched-pattern',
      '--threads=2',
    ]);
  });

  it('aborts the build when oxlint fails', () => {
    startLintGuard();
    child.emit('close', 1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('holds the build exit until oxlint finishes', () => {
    startLintGuard();
    process.exit(0);
    expect(exit).not.toHaveBeenCalled();
    child.emit('close', 0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('fails a finished build when oxlint fails afterwards', () => {
    startLintGuard();
    process.exit(0);
    child.emit('close', 2);
    expect(exit).toHaveBeenCalledWith(2);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('exits right away once oxlint has passed', () => {
    startLintGuard();
    child.emit('close', 0);
    process.exit(0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('extends the plumeria config with the overrides it is given', () => {
    startLintGuard({
      rules: { '@plumeria/no-physical-properties': 'error' },
      settings: { plumeria: { styleProp: 'sx' } },
    });
    const config = spawn.mock.calls[0][1][2];
    expect(JSON.parse(fs.readFileSync(config, 'utf8'))).toEqual({
      extends: [expect.stringMatching(/eslint-plugin[\\/]oxlint\.json$/)],
      rules: { '@plumeria/no-physical-properties': 'error' },
      settings: { plumeria: { styleProp: 'sx' } },
    });
    child.emit('close', 0);
    expect(fs.existsSync(config)).toBe(false);
  });
});
