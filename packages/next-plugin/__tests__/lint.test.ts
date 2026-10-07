jest.mock('@plumeria/eslint-plugin/guard', () => ({
  startLintGuard: jest.fn(() => true),
}));

import { startNextLintGuard } from '../src/lint';

const NEXT_BIN = '/app/node_modules/next/dist/bin/next';
const { startLintGuard } = jest.requireMock<{ startLintGuard: jest.Mock }>(
  '@plumeria/eslint-plugin/guard',
);

describe('startNextLintGuard', () => {
  beforeEach(() => startLintGuard.mockClear());

  it('does not start the lint guard for another command named build', () => {
    expect(
      startNextLintGuard({}, [
        'node',
        '/home/next/app/node_modules/jest/bin/jest.js',
        'build',
      ]),
    ).toBe(false);
    expect(startLintGuard).not.toHaveBeenCalled();
  });

  it('starts the lint guard for next build', () => {
    expect(
      startNextLintGuard({ '@plumeria/no-physical-properties': 'error' }, [
        'node',
        NEXT_BIN,
        'build',
      ]),
    ).toBe(true);
    expect(startLintGuard).toHaveBeenCalledWith({
      '@plumeria/no-physical-properties': 'error',
    });
  });

  it('does not start the lint guard for next dev', () => {
    expect(startNextLintGuard({}, ['node', NEXT_BIN, 'dev'])).toBe(false);
    expect(startLintGuard).not.toHaveBeenCalled();
  });
});
