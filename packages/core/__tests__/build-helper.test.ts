/* eslint-disable @plumeria/no-inner-call */
import { globalPromise_1 } from '../src/processors/css';
import { css } from '../src/index';

test('set function should create globalPromise and add styles to it', () => {
  expect(globalPromise_1).toBeUndefined();
  const styles = css.create({ test: { color: 'red' } });
  css.props(styles.test);
  expect(globalPromise_1).toBeDefined();
  expect(globalPromise_1).resolves.toContain('color: red');
});
