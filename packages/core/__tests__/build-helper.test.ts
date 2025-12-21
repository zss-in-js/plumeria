/* eslint-disable @plumeria/no-inner-call */
import { pQueue } from '../src/processors/css';
import { css } from '../src/index';

test('set function should create pQueue.promise and add styles to it', () => {
  expect(pQueue.promise).toBeUndefined();
  const styles = css.create({ test: { color: 'red' } });
  css.props(styles.test);
  expect(pQueue.promise).toBeDefined();
  expect(pQueue.promise).resolves.toContain('color: red');
});
