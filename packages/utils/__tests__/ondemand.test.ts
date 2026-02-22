/* eslint-disable @plumeria/validate-values */
/* Testing createTheme's on-demand style generation */

import { extractOndemandStyles } from '../src/parser';
import { scanAll } from '../src/parser';
import * as fs from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  globSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('extractOndemandStyles (On-Demand Filtering)', () => {
  let tables: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.globSync.mockReturnValue([]);
    tables = scanAll();
  });

  it('should only extract used theme variables', () => {
    const extracted: string[] = [];

    // Define a theme with two variables: primary and secondary
    const themeObj = {
      primary: { default: 'blue' },
      secondary: { default: 'green' },
    };
    const themeHash = 'themeHash123';
    tables.createThemeObjectTable[themeHash] = themeObj;
    tables.createThemeHashTable['T'] = themeHash;

    // Simulate usage of ONLY primary
    const style = { color: 'var(--primary)' };

    extractOndemandStyles(style, extracted, tables);

    const output = extracted.join('');

    // Check that primary is present
    expect(output).toContain('--primary: blue');

    // Check that secondary is NOT present
    expect(output).not.toContain('--secondary');
  });

  it('should extract multiple used variables', () => {
    const extracted: string[] = [];

    const themeObj = {
      primary: { default: 'blue' },
      secondary: { default: 'green' },
      accent: { default: 'pink' },
    };
    const themeHash = 'themeHash456';
    tables.createThemeObjectTable[themeHash] = themeObj;
    tables.createThemeHashTable['T'] = themeHash;

    const style = {
      color: 'var(--primary)',
      background: 'var(--accent)',
    };

    extractOndemandStyles(style, extracted, tables);

    const output = extracted.join('');

    expect(output).toContain('--primary: blue');
    expect(output).toContain('--accent: pink');
    expect(output).not.toContain('--secondary');
  });

  it('should not extract anything if no variables are used', () => {
    const extracted: string[] = [];

    const themeObj = {
      primary: { default: 'blue' },
    };
    const themeHash = 'themeHash789';
    tables.createThemeObjectTable[themeHash] = themeObj;
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
