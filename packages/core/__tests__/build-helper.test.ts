/* eslint-disable @plumeria/no-inner-call */
import { globalPromise_1 } from '../src/processors/css';
import { default as css } from '../src/css';

const styleSheet = 'button_xhyxio { color: red; }';
const base36hash = 'xhyxio';

jest.mock('zss-engine', () => ({
  isDevAndTest: true,
  isServer: false,
  transpiler: jest.fn(() => ({ styleSheet: styleSheet })),
  genBase36Hash: jest.fn(() => base36hash),
  injectServerCSS: jest.fn(),
  injectClientCSS: jest.fn(),
}));

test('set function should create globalPromise and add styles to it', () => {
  expect(globalPromise_1).toBeUndefined();
  css.create({ test: { color: 'red' } });
  expect(globalPromise_1).toBeDefined();
  expect(globalPromise_1).resolves.toContain('color: red');
});
