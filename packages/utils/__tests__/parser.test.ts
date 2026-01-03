import {
  objectExpressionToObject,
  tables,
  t,
  traverse,
  collectLocalConsts,
  scanAll,
  extractOndemandStyles,
  deepMerge,
} from '../src/parser';
import { parseSync, ObjectExpression } from '@swc/core';
import * as fs from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  globSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tables.staticTable = {};
    tables.keyframesHashTable = {};
    tables.keyframesObjectTable = {};
    tables.viewTransitionHashTable = {};
    tables.viewTransitionObjectTable = {};
    tables.themeTable = {};
    tables.createThemeObjectTable = {};
  });

  describe('type guards (t)', () => {
    it('should identify ObjectExpression', () => {
      const ast = parseSync('const x = {}', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isObjectExpression(init)).toBe(true);
      expect(t.isObjectExpression({ type: 'Other' })).toBe(false);
    });

    it('should identify Identifier with name option', () => {
      const ast = parseSync('const x = y', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isIdentifier(init, { name: 'y' })).toBe(true);
      expect(t.isIdentifier(init, { name: 'z' })).toBe(false);
    });

    it('should identify StringLiteral', () => {
      const ast = parseSync('const x = "hello"', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isStringLiteral(init)).toBe(true);
    });

    it('should identify NumericLiteral', () => {
      const ast = parseSync('const x = 42', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isNumericLiteral(init)).toBe(true);
    });

    it('should identify BooleanLiteral', () => {
      const ast = parseSync('const x = true', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isBooleanLiteral(init)).toBe(true);
    });

    it('should identify NullLiteral', () => {
      const ast = parseSync('const x = null', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isNullLiteral(init)).toBe(true);
    });
  });

  describe('traverse', () => {
    it('should traverse AST nodes', () => {
      const ast = parseSync('const x = 1; const y = 2;', {
        syntax: 'typescript',
      });
      const identifiers: string[] = [];

      traverse(ast, {
        Identifier({ node }) {
          identifiers.push(node.value);
        },
      });

      expect(identifiers).toContain('x');
      expect(identifiers).toContain('y');
    });

    it('should support stop functionality', () => {
      const ast = parseSync('const x = 1; const y = 2;', {
        syntax: 'typescript',
      });
      const identifiers: string[] = [];

      traverse(ast, {
        Identifier({ node, stop }) {
          identifiers.push(node.value);
          if (node.value === 'x') stop();
        },
      });

      expect(identifiers).toContain('x');
      expect(identifiers.length).toBe(1);
    });
  });

  describe('collectLocalConsts', () => {
    it('should collect string constants', () => {
      const ast = parseSync('const color = "red"; const size = "large";', {
        syntax: 'typescript',
      });
      const consts = collectLocalConsts(ast, 'test.ts');

      expect(consts.color).toBe('red');
      expect(consts.size).toBe('large');
    });

    it('should collect object constants', () => {
      const ast = parseSync('const theme = { primary: "blue" };', {
        syntax: 'typescript',
      });
      const consts = collectLocalConsts(ast, 'test.ts');

      expect(consts.theme).toEqual({ primary: 'blue' });
    });
  });

  describe('objectExpressionToObject', () => {
    it('should handle keyframes resolution', () => {
      const source = `const obj = { animation: fadeIn }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const keyframesHash = { fadeIn: 'abc123' };
      const result = objectExpressionToObject(
        objectExpr,
        {},
        keyframesHash,
        {},
        {},
      );

      expect(result.animation).toBe('kf-abc123');
    });

    it('should handle viewTransition resolution', () => {
      const source = `const obj = { viewTransitionName: slide }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const viewTransitionHash = { slide: 'xyz789' };
      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        viewTransitionHash,
        {},
      );

      expect(result.viewTransitionName).toBe('vt-xyz789');
    });

    it('should handle tokens resolution', () => {
      const source = `const obj = { color: T.primary }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const themeTable = { T: { primary: '#fff' } };
      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        themeTable,
      );

      expect(result.color).toBe('var(--primary)');
    });

    it('should handle boolean values', () => {
      const source = `const obj = { visible: true, hidden: false }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.visible).toBe(true);
      expect(result.hidden).toBe(false);
    });

    it('should handle numeric values', () => {
      const source = `const obj = { width: 100, height: 200 }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle unary expressions', () => {
      const source = `const obj = { value: -50, positive: +25 }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.value).toBe(-50);
      expect(result.positive).toBe(25);
    });

    it('should handle nested objects', () => {
      const source = `const obj = { outer: { inner: "value" } }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.outer).toEqual({ inner: 'value' });
    });

    it('should handle unresolved identifiers', () => {
      const source = `const obj = { color: unknownVar }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.color).toBe('[unresolved identifier]');
    });

    it('should handle unresolved member expressions', () => {
      const source = `const obj = { color: unknown.prop }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.color).toBe('[unresolved]');
    });

    it('should resolve member expression values from constTable', () => {
      const source = `const obj = { color: theme.primary }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const staticTable = { theme: { primary: 'blue' } };
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result.color).toBe('blue');
    });

    it('should resolve identifier values from constTable', () => {
      const source = `const obj = { color: myColor }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const staticTable = { myColor: 'red' };
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result.color).toBe('red');
    });

    it('should handle unsupported value types', () => {
      const source = `const obj = { func: () => {} }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.func).toBe('[unsupported value type]');
    });

    it('should handle template literal property keys', () => {
      const source = `const obj = { [\`&:hover\`]: { color: 'red' } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result).toHaveProperty('&:hover');
      expect(result['&:hover']).toEqual({ color: 'red' });
    });

    it('should handle template literal with interpolation', () => {
      const staticTable = { state: 'hover' };
      const source = `const obj = { [\`&:\${state}\`]: { color: 'blue' } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result).toHaveProperty('&:hover');
      expect(result['&:hover']).toEqual({ color: 'blue' });
    });

    it('should handle computed property with binary expression', () => {
      const staticTable = { prefix: '&:', state: 'focus' };
      const source = `const obj = { [prefix + state]: { outline: 'none' } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result).toHaveProperty('&:focus');
      expect(result['&:focus']).toEqual({ outline: 'none' });
    });

    it('should handle string literal computed property', () => {
      const source = `const obj = { ['&:active']: { transform: 'scale(0.95)' } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result).toHaveProperty('&:active');
      expect(result['&:active']).toEqual({ transform: 'scale(0.95)' });
    });

    it('should handle identifier computed property with constTable', () => {
      const staticTable = { myKey: '&:disabled' };
      const source = `const obj = { [myKey]: { opacity: 0.5 } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result).toHaveProperty('&:disabled');
      expect(result['&:disabled']).toEqual({ opacity: 0.5 });
    });

    it('should handle member expression computed property', () => {
      const staticTable = { selectors: { hover: '&:hover' } };
      const source = `const obj = { [selectors.hover]: { backgroundColor: 'lightblue' } }`;
      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: false,
      });

      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;
      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
      );

      expect(result).toHaveProperty('&:hover');
      expect(result['&:hover']).toEqual({ backgroundColor: 'lightblue' });
    });

    it('should ignore spread elements', () => {
      const source = `const obj = { ...spread, color: 'red' }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.color).toBe('red');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should ignore properties with unsupported keys', () => {
      // Using a computed property with a function call which getPropertyKey doesn't support and returns ''
      const source = `const obj = { [() => {}]: 'value', valid: 'ok' }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(objectExpr, {}, {}, {}, {});

      expect(result.valid).toBe('ok');
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('scan functions', () => {
    beforeEach(() => {
      mockedFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
    });

    it('should scan for keyframes', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/anim.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });',
      );

      const result = scanAll(addDependency);

      expect(addDependency).toHaveBeenCalledWith('/test/anim.ts');
      const keys = Object.keys(result.keyframesHashTable);
      expect(keys.some((key) => key.endsWith('-fade'))).toBe(true);
      expect(result.keyframesObjectTable).toBeDefined();
    });

    it('should scan for createStatic', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/consts.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'export const C = css.createStatic({ color: "red" });',
      );

      const result = scanAll(addDependency);

      expect(addDependency).toHaveBeenCalledWith('/test/consts.ts');
      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((key) => key.endsWith('-C'));
      expect(cKey).toBeDefined();
      expect(result.staticTable[cKey!]).toEqual({ color: 'red' });
    });

    it('should scan for createTheme', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/tokens.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'export const T = css.createTheme({ primary: "#fff" });',
      );

      const result = scanAll(addDependency);

      expect(addDependency).toHaveBeenCalledWith('/test/tokens.ts');
      const keys = Object.keys(result.themeTable);
      expect(keys.some((key) => key.endsWith('-T'))).toBe(true);
    });

    it('should scan for viewTransition', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/vt.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'export const slide = css.viewTransition({ group: { animationDuration: "0.3s" } });',
      );

      const result = scanAll(addDependency);

      expect(addDependency).toHaveBeenCalledWith('/test/vt.ts');
      const keys = Object.keys(result.viewTransitionHashTable);
      expect(keys.some((key) => key.endsWith('-slide'))).toBe(true);
      expect(result.viewTransitionObjectTable).toBeDefined();
    });

    it('should handle non-exported createStatic declarations', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/local.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'const C = css.createStatic({ size: "large" });',
      );

      const result = scanAll(addDependency);

      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((key) => key.endsWith('-C'));
      expect(cKey).toBeDefined();
      expect(result.staticTable[cKey!]).toEqual({ size: 'large' });
    });

    it('should handle non-exported keyframes declarations', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/local-kf.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });',
      );

      const result = scanAll(addDependency);

      const keys = Object.keys(result.keyframesHashTable);
      expect(keys.some((key) => key.endsWith('-fade'))).toBe(true);
    });

    it('should handle non-exported createTheme declarations', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/local-tokens.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'const T = css.createTheme({ primary: "#fff" });',
      );

      const result = scanAll(addDependency);

      const keys = Object.keys(result.themeTable);
      expect(keys.some((key) => key.endsWith('-T'))).toBe(true);
    });

    it('should handle non-exported viewTransition declarations', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/local-vt.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'const slide = css.viewTransition({ group: { animationDuration: "0.3s" } });',
      );

      const result = scanAll(addDependency);

      const keys = Object.keys(result.viewTransitionHashTable);
      expect(keys.some((key) => key.endsWith('-slide'))).toBe(true);
    });

    it('should skip files without target definition', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/normal.ts'] as any);
      mockedFs.readFileSync.mockReturnValue('const x = 1;');

      const resultKeyframes = scanAll(addDependency);
      expect(addDependency).not.toHaveBeenCalled();
      expect(Object.keys(resultKeyframes.keyframesHashTable)).toHaveLength(0);

      const resultConsts = scanAll(addDependency);
      expect(addDependency).not.toHaveBeenCalled();
      expect(Object.keys(resultConsts.staticTable)).toHaveLength(0);

      const resultTokens = scanAll(addDependency);
      expect(addDependency).not.toHaveBeenCalled();
      expect(Object.keys(resultTokens.themeTable)).toHaveLength(0);

      const resultViewTransition = scanAll(addDependency);
      expect(addDependency).not.toHaveBeenCalled();
      expect(
        Object.keys(resultViewTransition.viewTransitionHashTable),
      ).toHaveLength(0);
    });

    it('should skip directories', () => {
      const addDependency = jest.fn();
      mockedFs.globSync.mockReturnValue(['/test/dir'] as any);
      mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

      const result = scanAll(addDependency);

      expect(addDependency).not.toHaveBeenCalled();
      expect(Object.keys(result.keyframesHashTable)).toHaveLength(0);
    });
  });
});

describe('extractOndemandStyles (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tables.keyframesObjectTable = {
      abc: { from: { opacity: 0 }, to: { opacity: 1 } },
    };
    tables.viewTransitionObjectTable = {
      def: { group: { animationDuration: '0.3s' } },
    };
    tables.themeTable = {
      T: {},
    };
    tables.createThemeObjectTable = {
      xyz: {
        color: {
          default: 'red',
        },
      },
    };
  });

  it('should extract keyframes, viewTransition and theme styles', () => {
    const extracted: string[] = [];

    extractOndemandStyles(
      {
        a: 'kf-abc',
        b: 'vt-def',
        c: 'var(--color)',
        nested: {
          d: 'kf-abc',
        },
      },
      extracted,
    );

    // transpile の戻りは parser 側で共通の styleSheet を返すため
    expect(extracted.length).toBeGreaterThan(0);
  });

  it('should ignore invalid input', () => {
    const extracted: string[] = [];

    extractOndemandStyles(null, extracted);
    extractOndemandStyles('string', extracted);
    extractOndemandStyles(123, extracted);

    expect(extracted).toHaveLength(0);
  });
});

describe('deepMerge', () => {
  test('deeply merges nested objects', () => {
    expect(deepMerge({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({
      a: { x: 1, y: 2 },
    });
  });

  test('source object overwrites non-object target', () => {
    expect(deepMerge({ a: 1 }, { a: { x: 2 } })).toEqual({ a: { x: 2 } });
  });
});
