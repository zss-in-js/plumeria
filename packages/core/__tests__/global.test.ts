/* eslint-disable @plumeria/no-inner-call */
import { css } from '../src/index';

test('global return value is undefined"', () => {
  const result = css.global({ h1: { fontSize: 24 } });
  expect(result).toBeUndefined();
});
