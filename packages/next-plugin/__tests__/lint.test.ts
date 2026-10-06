jest.mock('@plumeria/eslint-plugin/guard', () => ({
  startLintGuard: jest.fn(() => true),
}));

import { isNextBuild, startNextLintGuard } from '../src/lint';

const NEXT_BIN = '/app/node_modules/next/dist/bin/next';
const { startLintGuard } = jest.requireMock<{ startLintGuard: jest.Mock }>(
  '@plumeria/eslint-plugin/guard',
);

describe('startNextLintGuard', () => {
  beforeEach(() => startLintGuard.mockClear());

  it('detects next build only', () => {
    expect(isNextBuild(['node', NEXT_BIN, 'build'])).toBe(true);
    expect(isNextBuild(['node', NEXT_BIN, 'dev'])).toBe(false);
    expect(
      isNextBuild(['node', '/app/node_modules/jest/bin/jest.js', 'build']),
    ).toBe(false);
  });

  it('starts the lint guard for next build', () => {
    expect(startNextLintGuard(['node', NEXT_BIN, 'build'])).toBe(true);
    expect(startLintGuard).toHaveBeenCalledTimes(1);
  });

  it('does not start the lint guard for next dev', () => {
    expect(startNextLintGuard(['node', NEXT_BIN, 'dev'])).toBe(false);
    expect(startLintGuard).not.toHaveBeenCalled();
  });
});
