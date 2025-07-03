/* eslint-disable @plumeria/no-inner-call */
import { globalPromise_1 } from '../src/processors/css';
import { css } from '../src/css';

test('set function should create globalPromise and add styles to it', () => {
  expect(globalPromise_1).toBeUndefined();
  css.create({ test: { color: 'red' } });
  expect(globalPromise_1).toBeDefined();
  expect(globalPromise_1).resolves.toContain('color: red');
});
