import { needsCompile, usesStyleProp } from '../src/stylePropFilter';

describe('usesStyleProp', () => {
  it('answers for the style prop alone', () => {
    expect(usesStyleProp('<div sx={a} />', 'sx', 'App.tsx')).toBe(true);
    expect(usesStyleProp("import '@plumeria/core';", 'sx', 'App.tsx')).toBe(
      false,
    );
  });

  it('is the half of needsCompile that the core import does not decide', () => {
    expect(needsCompile("import '@plumeria/core';", 'sx', 'App.tsx')).toBe(
      true,
    );
    expect(needsCompile('<div sx={a} />', 'sx', 'App.tsx')).toBe(true);
    expect(needsCompile('<div />', 'sx', 'App.tsx')).toBe(false);
  });
});
