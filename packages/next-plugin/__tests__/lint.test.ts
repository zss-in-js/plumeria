import { EventEmitter } from 'events';

const spawn = jest.fn();
jest.mock('child_process', () => ({
  spawn: (...args: unknown[]) => spawn(...args),
}));

import { isNextBuild, startLintGuard } from '../src/lint';

const NEXT_BUILD = ['node', '/app/node_modules/next/dist/bin/next', 'build'];

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

  it('detects next build only', () => {
    expect(isNextBuild(NEXT_BUILD)).toBe(true);
    expect(
      isNextBuild(['node', '/app/node_modules/next/dist/bin/next', 'dev']),
    ).toBe(false);
    expect(
      isNextBuild(['node', '/app/node_modules/jest/bin/jest.js', 'build']),
    ).toBe(false);
  });

  it('does not lint outside next build', () => {
    expect(
      startLintGuard(['node', '/app/node_modules/next/dist/bin/next', 'dev']),
    ).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('does not lint when a guard is already running', () => {
    process.env.PLUMERIA_LINT_GUARD = '1';
    expect(startLintGuard(NEXT_BUILD)).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('starts oxlint once with the plumeria config', () => {
    expect(startLintGuard(NEXT_BUILD)).toBe(true);
    expect(startLintGuard(NEXT_BUILD)).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args] = spawn.mock.calls[0];
    expect(args[0]).toMatch(/oxlint[\\/]bin[\\/]oxlint$/);
    expect(args.slice(1)).toEqual([
      '-c',
      expect.stringMatching(/eslint-plugin[\\/]oxlint\.json$/),
      '--deny-warnings',
    ]);
  });

  it('aborts the build when oxlint fails', () => {
    startLintGuard(NEXT_BUILD);
    child.emit('close', 1);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('holds the build exit until oxlint finishes', () => {
    startLintGuard(NEXT_BUILD);
    process.exit(0);
    expect(exit).not.toHaveBeenCalled();
    child.emit('close', 0);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('fails a finished build when oxlint fails afterwards', () => {
    startLintGuard(NEXT_BUILD);
    process.exit(0);
    child.emit('close', 2);
    expect(exit).toHaveBeenCalledWith(2);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('exits right away once oxlint has passed', () => {
    startLintGuard(NEXT_BUILD);
    child.emit('close', 0);
    process.exit(0);
    expect(exit).toHaveBeenCalledWith(0);
  });
});
