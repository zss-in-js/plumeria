import { cx } from '../src/cx';

test('cx returns a string', () => {
  const result = cx('test', '', false, undefined, 'abc');
  expect(result).toBe('test abc');
});
