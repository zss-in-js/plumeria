import loader from '../src/virtual-css-loader';
import type { LoaderContext } from 'webpack';
import { PlumeriaPlugin } from '../src/index';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  statSync: jest.fn(() => ({ isDirectory: () => false, isFile: () => true })),
  globSync: jest.fn(),
}));

const fs = require('fs') as jest.Mocked<typeof import('fs')>;

describe('virtual-css-loader', () => {
  let mockContext: Partial<LoaderContext<any>>;
  let mockPlugin: PlumeriaPlugin;
  let registerSpy: jest.SpyInstance;

  const setupLoader = (source: string, done: jest.DoneCallback) => {
    const callback = (err: Error | null) => {
      try {
        expect(err).toBeNull();
        done();
      } catch (e) {
        done(e);
      }
    };
    (mockContext.async as jest.Mock).mockReturnValue(callback);
    loader.call(mockContext as LoaderContext<any>, source);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.readFileSync.mockReturnValue('');
    fs.globSync.mockReturnValue([]);

    mockPlugin = new PlumeriaPlugin({ entryPaths: 'app' });
    registerSpy = jest.spyOn(mockPlugin, 'registerFileStyles');
    jest.spyOn(mockPlugin as any, 'writeCSS').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    mockContext = {
      async: jest.fn(),
      resourcePath: '/test.js',
      addDependency: jest.fn(),
      clearDependencies: jest.fn(),
      _compiler: { options: { plugins: [mockPlugin] } } as any,
      utils: { contextify: jest.fn((_, req) => req) } as any,
    };
  });

  describe('Basic functionality', () => {
    it('extracts and registers styles', (done) => {
      const callback = (err: Error | null, result?: string) => {
        expect(err).toBeNull();
        expect(result).toMatch(/import .*zero-virtual\.css/);
        expect(registerSpy).toHaveBeenCalledTimes(1);
        expect(registerSpy.mock.calls[0][1].baseStyles).toMatch(/color:\s*red/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `const styles = css.create({ key: { color: 'red' } });`,
      );
    });

    it('skips "use client" files', (done) => {
      const source = `"use client";\nconst styles = css.create({});`;
      const callback = (_err: Error | null, result?: string) => {
        expect(result).toBe(source);
        expect(registerSpy).not.toHaveBeenCalled();
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(mockContext as LoaderContext<any>, source);
    });

    it('handles parse errors', (done) => {
      setupLoader(`const styles = css.create({ invalid }}}`, done);
    });

    it('handles empty source', (done) => {
      const callback = (_err: Error | null, result?: string) => {
        expect(result).toMatch(/import .*zero-virtual\.css/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(mockContext as LoaderContext<any>, '');
    });

    it('handles multiple css.create calls', (done) => {
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1].baseStyles;
        expect(styles).toMatch(/red/);
        expect(styles).toMatch(/blue/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ a: { color: 'red' } }); css.create({ b: { color: 'blue' } });`,
      );
    });

    it('works without plugin', (done) => {
      mockContext._compiler!.options.plugins = [];
      const callback = (_err: Error | null, result?: string) => {
        expect(result).toMatch(/import .*zero-virtual\.css/);
        expect(registerSpy).not.toHaveBeenCalled();
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ key: { color: 'red' } });`,
      );
    });

    it('caches unchanged files', (done) => {
      const source = `css.create({ key: { color: 'red' } });`;
      let count = 0;
      const callback = () => {
        if (++count === 2) {
          expect(registerSpy).toHaveBeenCalledTimes(1);
          done();
        }
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(mockContext as LoaderContext<any>, source);
      loader.call(mockContext as LoaderContext<any>, source);
    });
  });

  describe('Value types', () => {
    const testValue = (desc: string, value: string, expected: RegExp) => {
      it(desc, (done) => {
        const callback = () => {
          expect(registerSpy.mock.calls[0][1].baseStyles).toMatch(expected);
          done();
        };
        (mockContext.async as jest.Mock).mockReturnValue(callback);
        loader.call(
          mockContext as LoaderContext<any>,
          `css.create({ key: { prop: ${value} } });`,
        );
      });
    };

    testValue('handles numbers', '0', /0/);
    testValue('handles negative numbers', '-10', /-10/);
    testValue('handles local constants', 'myVar', /--my-var/);
    testValue('handles unresolved identifiers', 'unknown', /--unknown/);
  });

  describe('External definitions', () => {
    const setupExternal = (path: string, content: string) => {
      fs.globSync.mockReturnValue([path]);
      fs.readFileSync.mockImplementation((p) => (p === path ? content : ''));
    };

    it('resolves defineConsts', (done) => {
      setupExternal(
        '/consts.ts',
        `export const C = css.defineConsts({ color: '#F00' });`,
      );
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toMatch(/#F00/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `import { C } from './consts'; css.create({ k: { color: C.color } });`,
      );
    });

    it('resolves defineConsts (non-exported)', (done) => {
      setupExternal(
        '/consts.ts',
        `const C = css.defineConsts({ color: '#F00' });`,
      );
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toMatch(/#F00/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { color: C.color } });`,
      );
    });

    it('resolves keyframes', (done) => {
      setupExternal(
        '/anim.ts',
        `export const fade = css.keyframes({ from: { opacity: 0 } });`,
      );
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1];
        expect(styles.keyframeStyles).toMatch(/@keyframes kf-/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `import { fade } from './anim'; css.create({ k: { animation: fade } });`,
      );
    });

    it('resolves keyframes (non-export)', (done) => {
      setupExternal(
        '/anim.ts',
        `const fade = css.keyframes({ from: { opacity: 0 } });`,
      );
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1];
        expect(styles.keyframeStyles).toMatch(/@keyframes kf-/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { animation: fade } });`,
      );
    });

    it('resolves defineTokens', (done) => {
      setupExternal(
        '/tokens.ts',
        `export const T = css.defineTokens({ primary: '#F00' });`,
      );
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1];
        expect(styles.tokenStyles).toBeDefined();
        expect(styles.baseStyles).toMatch(/var\(--primary\)/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `import { T } from './tokens'; css.create({ k: { color: T.primary } });`,
      );
    });

    it('resolves defineTokens (non-exported)', (done) => {
      setupExternal(
        '/tokens.ts',
        `const T = css.defineTokens({ primary: '#F00' });`,
      );
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1];
        expect(styles.tokenStyles).toBeDefined();
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { color: T.primary } });`,
      );
    });

    describe('resolveTokensTableMemberExpressionByNode coverage', () => {
      it('resolves string literal property access', (done) => {
        setupExternal(
          '/tokens.ts',
          `export const T = css.defineTokens({ 'my-color': '#F00' });`,
        );
        const callback = () => {
          const styles = registerSpy.mock.calls[0][1];
          expect(styles.baseStyles).toMatch(/var\(--my-color\)/);
          done();
        };
        (mockContext.async as jest.Mock).mockReturnValue(callback);
        loader.call(
          mockContext as LoaderContext<any>,
          `import { T } from './tokens'; css.create({ k: { color: T['my-color'] } });`,
        );
      });
    });

    it('resolves viewTransition', (done) => {
      setupExternal(
        '/vt.ts',
        `export const slide = css.viewTransition({ group: { animationDuration: '0.3s' } });`,
      );
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].viewTransitionStyles).toMatch(
          /::view-transition/,
        );
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `import { slide } from './vt'; css.create({ k: { viewTransitionName: slide } });`,
      );
    });

    it('resolves viewTransition (non-exported)', (done) => {
      setupExternal(
        '/vt.ts',
        `const slide = css.viewTransition({ group: { animationDuration: '0.3s' } });`,
      );
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].viewTransitionStyles).toMatch(
          /::view-transition/,
        );
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { viewTransitionName: slide } });`,
      );
    });
  });

  describe('Complex structures', () => {
    it('handles nested objects', (done) => {
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1].baseStyles;
        expect(styles).toMatch(/red/);
        expect(styles).toMatch(/blue/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { color: 'red', '&:hover': { color: 'blue' } } });`,
      );
    });

    it('handles template literal keys', (done) => {
      const callback = () => {
        const styles = registerSpy.mock.calls[0][1].baseStyles;
        expect(styles).toContain('color: red');
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        'css.create({ [`&:hover`]: { color: "red" } });',
      );
    });

    it('handles computed keys', (done) => {
      setupLoader(
        `const k = 'container'; css.create({ [k]: { color: 'red' } });`,
        done,
      );
    });

    it('handles spread properties', (done) => {
      setupLoader(`css.create({ ...spread, k: { color: 'red' } });`, done);
    });
  });

  describe('Edge cases', () => {
    it('handles boolean literals', (done) => {
      setupLoader(`css.create({ a: { p: true }, b: { p: false } });`, done);
    });

    it('handles null values', (done) => {
      setupLoader(`css.create({ k: { p: null } });`, done);
    });

    it('handles unsupported types', (done) => {
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toContain(
          '[unsupported value type]',
        );
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { p: /regex/ } });`,
      );
    });

    it('handles empty css.create', (done) => {
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toBeUndefined();
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(mockContext as LoaderContext<any>, `css.create({});`);
    });

    it('handles + unary operator', (done) => {
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toMatch(/50/);
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `css.create({ k: { width: +50 } });`,
      );
    });

    it('handles binary expressions', (done) => {
      setupLoader(
        `const p = 'hov'; css.create({ ['&:' + p]: { color: 'red' } });`,
        done,
      );
    });

    it('handles files with parse errors in scanning', (done) => {
      fs.globSync.mockReturnValue(['/bad.ts']);
      fs.readFileSync.mockImplementation((p) =>
        p === '/bad.ts' ? 'invalid {' : '',
      );
      setupLoader(`css.create({ k: { color: 'red' } });`, done);
    });

    it('handles directories in glob results', (done) => {
      fs.globSync.mockReturnValue(['/dir']);
      fs.statSync.mockReturnValue({
        isDirectory: () => true,
        isFile: () => false,
      } as any);
      setupLoader(`css.create({ k: { color: 'red' } });`, done);
    });

    it('handles non-css callee in external files', (done) => {
      fs.globSync.mockReturnValue(['/other.ts']);
      fs.readFileSync.mockImplementation((p) =>
        p === '/other.ts' ? `export const C = other.defineConsts({});` : '',
      );
      const callback = () => {
        expect(registerSpy.mock.calls[0][1].baseStyles).toContain(
          '[unresolved]',
        );
        done();
      };
      (mockContext.async as jest.Mock).mockReturnValue(callback);
      loader.call(
        mockContext as LoaderContext<any>,
        `import { C } from './other'; css.create({ k: { color: C.x } });`,
      );
    });
  });
});
