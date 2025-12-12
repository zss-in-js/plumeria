import { createStatic } from '../../src/api/createStatic';

describe('createStatic', () => {
  it('should generate a hash the first string in the returned static string literals', () => {
    const breakpoints = createStatic({
      md: '@media(max-width 768px)',
    });
    expect(breakpoints.md.startsWith('@media(max-width 768px)')).toBe(true);
  });
});
