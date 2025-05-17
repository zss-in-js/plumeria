/* eslint-disable @plumeria/no-inner-call */
import { default as css } from '../src/css';

const styleSheet = 'h1 { font-size: 24px; }';
const base36hash = 'abcdef';

jest.mock('zss-engine', () => ({
  isDevAndTest: true,
  isServer: true,
  transpiler: jest.fn(() => ({ styleSheet: styleSheet })),
  genBase36Hash: jest.fn(() => base36hash),
  injectServerCSS: jest.fn(),
  injectClientCSS: jest.fn(),
}));

test('global return value is undefined"', () => {
  const result = css.global({ h1: { fontSize: 24 } });
  expect(result).toBeUndefined();
});
