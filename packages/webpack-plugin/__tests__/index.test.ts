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
    plugin = new PlumeriaPlugin();
  });

  // --- apply() test ---
  it('should apply and register webpack hooks', () => {
    plugin.apply(mockCompiler);

    // invalid, watchRun, normalModuleFactory was called
    expect(mockCompiler.hooks.invalid.tap).toHaveBeenCalled();
    expect(mockCompiler.hooks.normalModuleFactory.tap).toHaveBeenCalled();

    // outFile is set to the correct location
    expect((plugin as any).outFile).toContain('zero-virtual.css');
  });

  it('should handle invalid hook callback', () => {
    plugin.apply(mockCompiler);

    const invalidCallback = mockCompiler.hooks.invalid.tap.mock.calls[0][1];
    const absPath = path.resolve('src/test.ts');
    (plugin as any).stylesByFile.set(absPath, {});

    invalidCallback('src/test.ts');

    expect((plugin as any).stylesByFile.has(absPath)).toBe(false);
  });

  it('should clear styles on watchRun', () => {
    plugin.apply(mockCompiler);

    // Setup initial styles
    const absPath = path.resolve('src/test.ts');
    (plugin as any).stylesByFile.set(absPath, { baseStyles: '.test {}' });
    expect((plugin as any).stylesByFile.size).toBe(1);

    // Trigger watchRun hook
    const watchRunCallback = mockCompiler.hooks.watchRun.tap.mock.calls[0][1];
    watchRunCallback();

    // Verify styles are cleared
    expect((plugin as any).stylesByFile.size).toBe(0);
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
      themeStyles: 'tk{}',
      baseStyles: 'base{}',
    });
    (plugin as any).stylesByFile.set('b', {
      filePath: 'b',
      lastAccessed: now,
      keyframeStyles: 'kf2{}',
      viewTransitionStyles: 'vt2{}',
      themeStyles: 'tk2{}',
      baseStyles: 'base2{}',
    });
    // lastAccessed is undefined
    (plugin as any).stylesByFile.set('c', {
      filePath: 'c',
      lastAccessed: undefined,
      keyframeStyles: 'kf3{}',
      viewTransitionStyles: 'vt3{}',
      themeStyles: 'tk3{}',
      baseStyles: 'base3{}',
    });

    // If lastAccessed is 0
    (plugin as any).stylesByFile.set('d', {
      filePath: 'd',
      lastAccessed: 0,
      keyframeStyles: 'kf4{}',
      viewTransitionStyles: 'vt4{}',
      themeStyles: 'tk4{}',
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
