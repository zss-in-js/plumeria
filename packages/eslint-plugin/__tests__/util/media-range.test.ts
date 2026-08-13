import { impliesCondition } from '../../src/util/mediaRange';

describe('impliesCondition', () => {
  it.each([
    ['@media (min-width: 900px)', '@media (min-width: 600px)'],
    ['@media (max-width: 600px)', '@media (max-width: 900px)'],
    ['@media (min-height: 40em)', '@media (min-height: 20em)'],
  ])('reads %s as the narrower of the pair against %s', (narrow, broad) => {
    expect(impliesCondition(narrow, broad)).toBe(true);
    expect(impliesCondition(broad, narrow)).toBe(false);
  });

  /**
   * Anything the parser cannot compare has to answer no. A guess here would
   * report a pair that may not overlap at all.
   */
  it.each([
    ['@media (min-width: 600px)', '@media (max-width: 900px)'],
    ['@media (min-width: 600px)', '@media (min-height: 600px)'],
    ['@media (min-width: 40em)', '@media (min-width: 600px)'],
    [
      '@media (min-width: 600px) and (max-width: 900px)',
      '@media (min-width: 600px)',
    ],
    ['@media print', '@media screen'],
    ['@supports (display: grid)', '@supports (display: flex)'],
    ['@container (min-width: 900px)', '@container (min-width: 600px)'],
    ['@media (min-width: 600px)', '@media (min-width: 600px)'],
  ])('does not rank %s against %s', (a, b) => {
    expect(impliesCondition(a, b)).toBe(false);
    expect(impliesCondition(b, a)).toBe(false);
  });
});
