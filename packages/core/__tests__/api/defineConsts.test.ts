import { defineConsts } from '../../src/api/consts';

describe('defineConsts', () => {
  it('should generate a hash the first string in the returned static string literals', () => {
    const breakpoints = defineConsts({
      md: '@media(max-width 768px)',
    });
    expect(breakpoints.md.startsWith('@media(max-width 768px)')).toBe(true);
  });
});
