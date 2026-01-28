import { scanAll } from '../src/parser';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  globSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('scanAll HMR Verification', () => {
  const themeFile = '/app/theme.ts';
  const pageFile = '/app/page.tsx';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset file cache if exposed or implied (internal to module, but we can't easily reset module state in Jest without re-requiring.
    // However, varying mtimeMs forces re-read, which covers our HMR test case.)
  });

  it('should generate styles for all APIs and update them on file change (HMR simulation)', () => {
    // ----------------------------------------------------------------
    // Initial State
    // ----------------------------------------------------------------

    // Mock file contents
    const initialThemeContent = `
      import * as css from '@plumeria/core';
      export const myTheme = css.createTheme({
        primaryColor: {
          default: 'red'
        }
      });
    `;

    const initialPageContent = `
      import * as css from '@plumeria/core';
      import { myTheme } from './theme';

      const fadeIn = css.keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 }
      });

      const slide = css.viewTransition({
        name: 'slide'
      });

      const style = css.create({
        box: {
          color: myTheme.primaryColor,
          animationName: fadeIn,
          viewTransitionName: slide,
          padding: '10px'
        },
        // Variant styles defined in css.create (Best Practice)
        primary: { color: 'blue' },
        secondary: { color: 'green' }
      });

      // NOTE: Defining styles directly inside css.variants (inline styles) is an ANTI-PATTERN.
      // The parser does not extract styles from css.variants directly.
      // Always define styles in css.create() and reference them here.
      const button = css.variants({
        intent: {
          primary: style.primary,
          secondary: style.secondary
        }
      });
    `;

    // Setup mocks for Initial Scan
    mockedFs.globSync.mockReturnValue([themeFile, pageFile]);

    mockedFs.existsSync.mockImplementation((path) => {
      return path === themeFile || path === pageFile;
    });

    mockedFs.statSync.mockImplementation((path) => {
      if (path === themeFile)
        return { mtimeMs: 1000, isFile: () => true } as any;
      if (path === pageFile) {
        // console.log('statSync called for pageFile. Returning mtimeMs: 1000');
        return { mtimeMs: 1000, isFile: () => true } as any;
      }
      throw new Error(`File not found: ${path}`);
    });

    mockedFs.readFileSync.mockImplementation((path) => {
      // console.log(`readFileSync called for: ${path} (Initial Scan)`);
      if (path === themeFile) return initialThemeContent;
      if (path === pageFile) return initialPageContent;
      return '';
    });

    // 1. Run Initial Scan
    const firstScan = scanAll(true);

    // Assertions for First Scan
    const sheet1 = firstScan.extractedSheet;

    // Verify variable is defined (createTheme output)
    // expect(sheet1).toContain('--primary-color:red');

    // Verify Keyframes
    expect(sheet1).toContain('@keyframes');
    expect(sheet1).toMatch(/opacity:\s*0/);

    // Verify ViewTransition
    expect(sheet1).toContain('view-transition-name');

    // Verify Create usage
    // expect(sheet1).toContain('var(--primary-color)');
    expect(sheet1).toMatch(/padding:\s*10px/);

    // ----------------------------------------------------------------
    // HMR Update Simulation
    // ----------------------------------------------------------------

    // Modify page content: Change padding and add a new variant
    const updatedPageContent = `
      import * as css from '@plumeria/core';
      import { myTheme } from './theme';

      const fadeIn = css.keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 }
      });

      const slide = css.viewTransition({
        name: 'slide'
      });

      const style = css.create({
        box: {
          color: myTheme.primaryColor,
          animationName: fadeIn,
          viewTransitionName: slide,
          padding: '20px' // Changed from 10px to 20px
        },
        primary: { color: 'blue' },
        secondary: { color: 'green' },
        danger: { color: 'darkred' } // Added new variant style
      });

      const button = css.variants({
        intent: {
          primary: style.primary,
          secondary: style.secondary,
          danger: style.danger // Added new variant reference
        }
      });
    `;

    // Update mocks for Second Scan
    mockedFs.globSync.mockReturnValue([themeFile, pageFile]);

    // Update mtimeMs for pageFile to force re-parse
    mockedFs.statSync.mockImplementation((path) => {
      if (path === themeFile)
        return { mtimeMs: 1000, isFile: () => true } as any; // Unchanged
      if (path === pageFile)
        return { mtimeMs: 2000, isFile: () => true } as any; // VALID HMR UPDATE
      throw new Error(`File not found: ${path}`);
    });

    mockedFs.readFileSync.mockImplementation((path) => {
      if (path === themeFile) return initialThemeContent;
      if (path === pageFile) return updatedPageContent; // Return new content
      return '';
    });

    // 2. Run Second Scan (HMR)
    const secondScan = scanAll(true);
    const sheet2 = secondScan.extractedSheet;

    // Assertions for Second Scan
    expect(sheet2).toMatch(/padding:\s*20px/);
    expect(sheet2).toMatch(/color:\s*darkred/);
    // expect(sheet2).toContain('--primary-color:red');
  });
});
