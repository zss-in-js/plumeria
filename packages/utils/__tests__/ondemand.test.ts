/* Testing createTheme's on-demand style generation */

import { extractOndemandStyles } from '../src/parser';
import { genBase36Hash } from 'zss-engine';

describe('extractOndemandStyles (On-Demand Filtering)', () => {
  let tables: any;

  beforeEach(() => {
    jest.clearAllMocks();
    tables = {
      createThemeObjectTable: {},
      createThemeHashTable: {},
      createThemeSelectorTable: {},
    };
  });

  it('should only extract used theme variables', () => {
    const extracted: string[] = [];

    // Define a theme with two variables: primary and secondary
    const themeObj = {
      primary: { default: 'blue', theme: 'white' },
      secondary: { default: 'green', theme: 'black' },
    };
    const themeHash = 'themeHash123';
    tables.createThemeObjectTable[themeHash] = themeObj;
    tables.createThemeSelectorTable[themeHash] = '.dark';
    tables.createThemeHashTable['T'] = themeHash;

    const primaryHash = genBase36Hash(
      { primary: { default: 'blue', theme: 'white' } },
      1,
      8,
    );
    const secondaryHash = genBase36Hash(
      { secondary: { default: 'green', theme: 'black' } },
      1,
      8,
    );

    // Simulate usage of ONLY primary
    const style = { color: `var(--${primaryHash}-primary)` };

    extractOndemandStyles(style, extracted, tables);

    const output = extracted.join('');

    // Check that primary is present
    expect(output).toContain(`--${primaryHash}-primary: blue`);
    expect(output).toContain(`--${primaryHash}-primary: white`);

    // Check that secondary is NOT present
    expect(output).not.toContain(`--${secondaryHash}-secondary`);
  });

  it('should extract multiple used variables', () => {
    const extracted: string[] = [];

    const themeObj = {
      primary: { default: 'blue', theme: 'white' },
      secondary: { default: 'green', theme: 'black' },
      accent: { default: 'pink', theme: 'purple' },
    };
    const themeHash = 'themeHash456';
    tables.createThemeObjectTable[themeHash] = themeObj;
    tables.createThemeSelectorTable[themeHash] = '.dark';
    tables.createThemeHashTable['T'] = themeHash;

    const primaryHash = genBase36Hash(
      { primary: { default: 'blue', theme: 'white' } },
      1,
      8,
    );
    const secondaryHash = genBase36Hash(
      { secondary: { default: 'green', theme: 'black' } },
      1,
      8,
    );
    const accentHash = genBase36Hash(
      { accent: { default: 'pink', theme: 'purple' } },
      1,
      8,
    );

    const style = {
      color: `var(--${primaryHash}-primary)`,
      background: `var(--${accentHash}-accent)`,
    };

    extractOndemandStyles(style, extracted, tables);

    const output = extracted.join('');

    expect(output).toContain(`--${primaryHash}-primary: blue`);
    expect(output).toContain(`--${primaryHash}-primary: white`);
    expect(output).toContain(`--${accentHash}-accent: pink`);
    expect(output).toContain(`--${accentHash}-accent: purple`);
    expect(output).not.toContain(`--${secondaryHash}-secondary`);
  });

  it('should not extract anything if no variables are used', () => {
    const extracted: string[] = [];

    const themeObj = {
      primary: { default: 'blue', theme: 'white' },
    };
    const themeHash = 'themeHash789';
    tables.createThemeObjectTable[themeHash] = themeObj;
    tables.createThemeSelectorTable[themeHash] = '.dark';
    tables.createThemeHashTable['T'] = themeHash;

    const style = { color: 'red' }; // No var usage

    extractOndemandStyles(style, extracted, tables);

    expect(extracted).toHaveLength(0);
  });

  it('should handle malformed var() without closing parenthesis safely', () => {
    const extracted: string[] = [];

    // Simulate malformed usage: var(--primary without closing )
    // This triggers the `break` in the loop to avoid infinite loop
    const style = { color: 'var(--primary  ignored stuff' };

    extractOndemandStyles(style, extracted, tables);

    const output = extracted.join('');
    // Should NOT extract anything because it's invalid
    expect(output).not.toContain('--primary');
  });
});
