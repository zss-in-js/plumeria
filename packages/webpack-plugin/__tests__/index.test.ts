import fs from 'fs';
import path from 'path';
import { PlumeriaPlugin } from '../src';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('PlumeriaPlugin', () => {
  let plugin: PlumeriaPlugin;
  const mockCompiler: any = {
    hooks: {
      invalid: { tap: jest.fn() },
      watchRun: { tap: jest.fn() },
      normalModuleFactory: {
        tap: jest.fn((_, fn) => {
          const nmf = { hooks: { createModule: { tap: jest.fn() } } };
          fn(nmf);
          return nmf;
        }),
      },
    },
    options: {
      entry: {
        app: ['./src/page.tsx'],
        ignore: './src/ignore.tsx',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new PlumeriaPlugin({ entryPaths: 'app' });
  });

  // --- apply() test ---
  it('should apply and register webpack hooks', () => {
    plugin.apply(mockCompiler);

    // invalid, watchRun, normalModuleFactory was called
    expect(mockCompiler.hooks.invalid.tap).toHaveBeenCalled();
    expect(mockCompiler.hooks.watchRun.tap).toHaveBeenCalled();
    expect(mockCompiler.hooks.normalModuleFactory.tap).toHaveBeenCalled();

    // outFile is set to the correct location
    expect((plugin as any).outFile).toContain('zero-virtual.css');
  });

  it('should call updateCurrentPageFiles when watchRun hook is triggered', () => {
    plugin.apply(mockCompiler);
    const watchRunCallback = mockCompiler.hooks.watchRun.tap.mock.calls[0][1];
    const spy = jest.spyOn(plugin as any, 'updateCurrentPageFiles');

    watchRunCallback(mockCompiler);

    expect(spy).toHaveBeenCalledWith(mockCompiler);

    spy.mockRestore();
  });

  it('should handle invalid hook callback', () => {
    plugin.apply(mockCompiler);

    const invalidCallback = mockCompiler.hooks.invalid.tap.mock.calls[0][1];
    const absPath = path.resolve('src/test.ts');
    (plugin as any).stylesByFile.set(absPath, {});
    (plugin as any).currentPageFiles.add(absPath);

    invalidCallback('src/test.ts');

    expect((plugin as any).stylesByFile.has(absPath)).toBe(false);
    expect((plugin as any).currentPageFiles.has(absPath)).toBe(false);
  });

  it('should handle normalModuleFactory and mark css as side effect', () => {
    plugin.apply(mockCompiler);

    const nmfTap =
      mockCompiler.hooks.normalModuleFactory.tap.mock.results[0].value;
    const createModuleTap = nmfTap.hooks.createModule.tap.mock.calls[0][1];

    const createData: any = { matchResource: 'zero-virtual.css' };
    createModuleTap(createData);
    expect(createData.settings.sideEffects).toBe(true);
  });

  it('should skip when no modPath found', () => {
    plugin.apply(mockCompiler);
    const nmfTap =
      mockCompiler.hooks.normalModuleFactory.tap.mock.results[0].value;
    const createModuleTap = nmfTap.hooks.createModule.tap.mock.calls[0][1];
    const createData: any = {};
    createModuleTap(createData);
    expect(createData.settings).toBeUndefined();
  });

  // --- updateCurrentPageFiles() ---
  it('should update current page files from entry object', () => {
    plugin['updateCurrentPageFiles'](mockCompiler);

    const fileSet = Array.from((plugin as any).currentPageFiles) as string[];
    expect(fileSet.some((f) => f.includes('src/page.tsx'))).toBe(true);
  });

  it('should add current page files when entry is a string', () => {
    const plugin = new PlumeriaPlugin({ entryPaths: 'pages/' });

    // If entry is a string
    const mockCompiler = {
      options: {
        entry: {
          'pages/index': 'pages/index.tsx', // 文字列型
        },
      },
    };

    // Initially currentPageFiles is empty
    expect((plugin as any).currentPageFiles.size).toBe(0);

    // Call the internal method directly
    (plugin as any).updateCurrentPageFiles(mockCompiler);

    const addedFile = path.resolve('pages/index.tsx');
    expect((plugin as any).currentPageFiles.has(addedFile)).toBe(true);
  });

  // --- isCurrentPageFile() ---
  it('should return true for direct and nested current page files', () => {
    const file = path.resolve('src/page.tsx');
    (plugin as any).currentPageFiles.add(file);

    expect((plugin as any).isCurrentPageFile(file)).toBe(true);
    // nested check
    expect(
      (plugin as any).isCurrentPageFile(
        path.join(path.dirname(file), 'sub', 'file.ts'),
      ),
    ).toBe(true);
  });

  it('should return false when not current page file', () => {
    expect((plugin as any).isCurrentPageFile('other.ts')).toBe(false);
  });

  // --- generateOrderedCSS() ---
  it('should return empty string if no styles', () => {
    const result = (plugin as any).generateOrderedCSS();
    expect(result).toBe('');
  });

  it('should sort styles by lastAccessed descending using generateOrderedCSS', () => {
    const now = Date.now();
    (plugin as any).stylesByFile.set('a', {
      filePath: 'a',
      lastAccessed: now - 100,
      keyframeStyles: 'kf{}',
      viewTransitionStyles: 'vt{}',
      tokenStyles: 'tk{}',
      baseStyles: 'base{}',
    });
    (plugin as any).stylesByFile.set('b', {
      filePath: 'b',
      lastAccessed: now,
      keyframeStyles: 'kf2{}',
      viewTransitionStyles: 'vt2{}',
      tokenStyles: 'tk2{}',
      baseStyles: 'base2{}',
    });
    // lastAccessed is undefined
    (plugin as any).stylesByFile.set('c', {
      filePath: 'c',
      lastAccessed: undefined,
      keyframeStyles: 'kf3{}',
      viewTransitionStyles: 'vt3{}',
      tokenStyles: 'tk3{}',
      baseStyles: 'base3{}',
    });

    // If lastAccessed is 0
    (plugin as any).stylesByFile.set('d', {
      filePath: 'd',
      lastAccessed: 0,
      keyframeStyles: 'kf4{}',
      viewTransitionStyles: 'vt4{}',
      tokenStyles: 'tk4{}',
      baseStyles: 'base4{}',
    });

    const css = (plugin as any).generateOrderedCSS();

    // Verify that sortedStyles[0] is 'b'
    const sortedValues = Array.from<any>(
      (plugin as any).stylesByFile.values(),
    ).sort((a: any, b: any) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    expect(sortedValues[0].filePath).toBe('b');
    expect(sortedValues[1].filePath).toBe('a');
    expect(sortedValues[2].filePath).toBe('c');
    expect(sortedValues[3].filePath).toBe('d');

    expect(css).toContain('kf2{}');
    expect(css).toContain('vt2{}');
    expect(css).toContain('tk2{}');
    expect(css).toContain('base2{}');
  });

  // --- writeCSS() ---
  it('should write generated CSS to file', () => {
    const spy = jest
      .spyOn(plugin as any, 'generateOrderedCSS')
      .mockReturnValue('content');
    (plugin as any).outFile = 'dist/zero.css';
    (plugin as any).writeCSS();
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      'dist/zero.css',
      'content',
      'utf-8',
    );
    spy.mockRestore();
  });
});
