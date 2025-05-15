import { globalPromise } from '../src/methods/create-build-helper';
import { create } from '../src/methods/create';

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
  expect(globalPromise).toBeUndefined();
  create({ test: { color: 'red' } });
  expect(globalPromise).toBeDefined();
  expect(globalPromise).resolves.toContain('color: red');
});
