import path from 'path';

// Mock fs at the module level so it applies to all requires
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  statSync: jest.fn(),
}));

describe('resolver', () => {
  let resolveImportPath: typeof import('../src/resolver').resolveImportPath;
  let mockedFs: any;
  // Use a subdirectory as root to avoid issues with resolver loop terminating at system root
  const root = path.resolve('/project');
  const importer = path.resolve(root, 'app/page.ts');

  // Helper to setup mock file system for the CURRENT fs mock
  const setupMockFs = (files: string[]) => {
    mockedFs.existsSync.mockImplementation((p: any) =>
      files.includes(path.resolve(p)),
    );
    mockedFs.statSync.mockImplementation(
      (p: any) =>
        ({
          isFile: () => files.includes(path.resolve(p)),
        }) as any,
    );
  };

  beforeEach(() => {
    jest.resetModules(); // Clear cache of all modules including resolver.ts and fs
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Mock process.cwd to return the test root
    jest.spyOn(process, 'cwd').mockReturnValue(root);

    // Re-require fs to get the fresh mock instance for this test context
    mockedFs = require('fs');
    // Re-require resolver to ensure fresh module-level caches (tsConfigCache, etc.)
    resolveImportPath = require('../src/resolver').resolveImportPath;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('relative imports', () => {
    it('should resolve local sibling file', () => {
      const target = path.resolve(root, 'app/utils.ts');
      setupMockFs([target]);
      expect(resolveImportPath('./utils', importer)).toBe(target);
    });

    it('should resolve local sibling file with extension', () => {
      const target = path.resolve(root, 'app/utils.ts');
      setupMockFs([target]);
      expect(resolveImportPath('./utils.ts', importer)).toBe(target);
    });

    it('should resolve index file', () => {
      const target = path.resolve(root, 'app/components/index.ts');
      setupMockFs([target]);
      expect(resolveImportPath('./components', importer)).toBe(target);
    });

    it('should return null if file not found', () => {
      setupMockFs([]);
      expect(resolveImportPath('./nonexistent', importer)).toBeNull();
    });
  });

  describe('tsconfig paths', () => {
    const tsConfigPath = path.resolve(root, 'tsconfig.json');

    it('should resolve aliased path', () => {
      const target = path.resolve(root, 'lib/utils.ts');

      // Setup fs mock BEFORE mocking the require(tsConfigPath)
      setupMockFs([target, tsConfigPath]);

      // Mock the require call for tsconfig.json
      // Since we reset modules, we must ensure this mock is active for the upcoming resolver usage
      jest.doMock(
        tsConfigPath,
        () => ({
          compilerOptions: {
            paths: {
              '@/*': ['lib/*'],
            },
          },
        }),
        { virtual: true },
      );

      // We need to re-require resolver inside the test if we did doMock AFTER beforeEach?
      // No, resetModules was in beforeEach. if we call doMock NOW, is it too late?
      // resolver.ts is lazy?
      // resolver.ts has:
      // function getTsConfig() { ... const config = require(tsConfigPath); ... }
      // It calls require lazily inside the function. So doMock here SHOULD work.

      expect(resolveImportPath('@/utils', importer)).toBe(target);
    });

    it('should resolve fallback if multiple paths', () => {
      const target = path.resolve(root, 'libs/ui/src/button.ts');
      setupMockFs([target, tsConfigPath]);

      jest.doMock(
        tsConfigPath,
        () => ({
          compilerOptions: {
            paths: {
              '@ui/*': ['libs/ui/src/*', 'libs/common/ui/*'],
            },
          },
        }),
        { virtual: true },
      );

      expect(resolveImportPath('@ui/button', importer)).toBe(target);
    });

    it('should handle tsconfig without paths', () => {
      const target = path.resolve(root, 'lib/utils.ts');
      setupMockFs([target, tsConfigPath]);

      jest.doMock(
        tsConfigPath,
        () => ({
          compilerOptions: {},
        }),
        { virtual: true },
      );

      expect(resolveImportPath('@/utils', importer)).toBeNull();
    });

    it('should handle tsconfig without compilerOptions', () => {
      setupMockFs([tsConfigPath]);

      jest.doMock(
        tsConfigPath,
        () => ({
          // No compilerOptions
        }),
        { virtual: true },
      );

      expect(resolveImportPath('@/utils', importer)).toBeNull();
    });

    it('should handle invalid tsconfig (require throws)', () => {
      setupMockFs([tsConfigPath]);

      jest.doMock(
        tsConfigPath,
        () => {
          throw new Error('Invalid JSON');
        },
        { virtual: true },
      );

      // First call (uncached)
      expect(resolveImportPath('@/utils', importer)).toBeNull();

      // Second call (cached) - this hits lines 18-20 with a null config
      expect(resolveImportPath('@/utils', importer)).toBeNull();
    });
  });

  describe('package resolution (fallback)', () => {
    it('should resolve relative to package root if no tsconfig paths match', () => {
      const pkgJsonPath = path.resolve(root, 'package.json');
      const target = path.resolve(root, 'types/common.ts');

      setupMockFs([pkgJsonPath, target]);

      // We need to make sure loop logic works.
      // The resolver checks for package.json to determine root for non-relative lookups relative to current dir?

      expect(resolveImportPath('types/common', importer)).toBe(target);
    });
  });

  describe('caching', () => {
    it('should reuse cached tsconfig result', () => {
      const tsConfigPath = path.resolve(root, 'tsconfig.json');
      const target = path.resolve(root, 'lib/utils.ts');

      setupMockFs([target, tsConfigPath]);

      jest.doMock(
        tsConfigPath,
        () => ({
          compilerOptions: {
            paths: {
              '@/*': ['lib/*'],
            },
          },
        }),
        { virtual: true },
      );

      // First call
      expect(resolveImportPath('@/utils', importer)).toBe(target);

      // Clear fs mocks calls to verify they are not called again for tsconfig lookup
      mockedFs.existsSync.mockClear();

      // Second call - should hit cache
      expect(resolveImportPath('@/utils', importer)).toBe(target);

      // Verify no TS config lookup logic involved (checking if file exists)
      // Note: resolveWithExtension calls existsSync for the result file.
      // But we shouldn't see calls for tsconfig.json
      expect(mockedFs.existsSync).not.toHaveBeenCalledWith(tsConfigPath);
    });

    it('should reuse cached null result (no tsconfig)', () => {
      // setup with NO tsconfig
      setupMockFs([]);

      // First call
      // Use non-relative path to bypass early return for relative imports
      resolveImportPath('pkg/foo', importer);

      // Clear calls
      mockedFs.existsSync.mockClear();

      // Second call
      resolveImportPath('pkg/foo', importer);

      // Should not check for tsconfig.json in the dir loop
      // The importer dir is /project/app
      // It normally checks /project/app/tsconfig.json and /project/tsconfig.json
      // With cache, it should check none.
      const tsConfigPathHelper = path.join(
        path.dirname(importer),
        'tsconfig.json',
      );
      expect(mockedFs.existsSync).not.toHaveBeenCalledWith(tsConfigPathHelper);
    });
  });
});
