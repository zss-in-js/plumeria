/* eslint-disable @plumeria/validate-values */
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
import { genBase36Hash } from 'zss-engine';
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

    it('should identify ConditionalExpression', () => {
      const ast = parseSync('const x = true ? 1 : 0', { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const init = varDecl.declarations[0].init;
      expect(t.isConditionalExpression(init)).toBe(true);
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
      const consts = collectLocalConsts(ast);

      expect(consts.color).toBe('red');
      expect(consts.size).toBe('large');
    });

    it('should collect object constants', () => {
      const ast = parseSync('const theme = { primary: "blue" };', {
        syntax: 'typescript',
      });
      const consts = collectLocalConsts(ast);

      expect(consts.theme).toEqual({ primary: 'blue' });
    });

    it('should resolve variable references in objects', () => {
      const ast = parseSync('const x = 1; const obj = { val: x };', {
        syntax: 'typescript',
      });
      const consts = collectLocalConsts(ast);

      expect(consts.x).toBe(1);
      expect(consts.obj).toEqual({ val: 1 });
    });

    it('should handle circular dependency in constants', () => {
      // Direct recursion via object to trigger visiting.has(name)
      const ast = parseSync('const a = { prop: a };', { syntax: 'typescript' });
      const consts = collectLocalConsts(ast);
      expect(consts.a).toBeDefined(); // { prop: '[unresolved identifier]' }
      expect(consts.a.prop).toBe('[unresolved identifier]');
    });

    it('should handle references to non-local variables', () => {
      // Triggers !decls.has(name)
      const ast = parseSync('const a = { prop: external };', {
        syntax: 'typescript',
      });
      const consts = collectLocalConsts(ast);
      expect(consts.a.prop).toBe('[unresolved identifier]');
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
        {},
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
        {},
        {},
      );

      expect(result.color).toBe('var(--primary)');
    });

    it('should handle boolean values', () => {
      const source = `const obj = { visible: true, hidden: false }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.visible).toBe(true);
      expect(result.hidden).toBe(false);
    });

    it('should handle numeric values', () => {
      const source = `const obj = { width: 100, height: 200 }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle unary expressions', () => {
      const source = `const obj = { value: -50, positive: +25 }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.value).toBe(-50);
      expect(result.positive).toBe(25);
    });

    it('should handle nested objects', () => {
      const source = `const obj = { outer: { inner: "value" } }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.outer).toEqual({ inner: 'value' });
    });

    it('should handle unresolved identifiers', () => {
      const source = `const obj = { color: unknownVar }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.color).toBe('[unresolved identifier]');
    });

    it('should handle unresolved member expressions', () => {
      const source = `const obj = { color: unknown.prop }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

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

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

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
      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

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
      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

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

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.color).toBe('red');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should ignore properties with unsupported keys', () => {
      // Using a computed property with a function call which getPropertyKey doesn't support and returns ''
      const source = `const obj = { [() => {}]: 'value', valid: 'ok' }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        {},
        {},
        {},
        {},
        {},
        {},
      );

      expect(result.valid).toBe('ok');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should NOT resolve identifier keys against staticTable', () => {
      // This reproduces the bug where `transition` key is replaced by `transition` variable's value
      const staticTable = { transition: '0.8s ease' };
      const source = `const obj = { transition: '0.3s' }`;
      const ast = parseSync(source, { syntax: 'typescript' });
      const varDecl = ast.body[0] as any;
      const objectExpr = varDecl.declarations[0].init as ObjectExpression;

      const result = objectExpressionToObject(
        objectExpr,
        staticTable,
        {},
        {},
        {},
        {},
        {},
      );

      // Should remain "transition", not become "0.8s ease"
      expect(result).toHaveProperty('transition');
      expect(result.transition).toBe('0.3s');
    });
  });

  describe('scan functions', () => {
    beforeEach(() => {
      mockedFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
    });

    it('should scan for keyframes', () => {
      mockedFs.globSync.mockReturnValue(['/test/anim.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });',
      );

      const result = scanAll();
      const keys = Object.keys(result.keyframesHashTable);
      expect(keys.some((key) => key.endsWith('-fade'))).toBe(true);
      expect(result.keyframesObjectTable).toBeDefined();
    });

    it('should scan for createStatic', () => {
      mockedFs.globSync.mockReturnValue(['/test/consts.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; export const C = css.createStatic({ color: "red" });',
      );

      const result = scanAll();

      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((key) => key.endsWith('-C'));
      expect(cKey).toBeDefined();
      expect(result.staticTable[cKey!]).toEqual({ color: 'red' });
    });

    it('should scan for createTheme', () => {
      mockedFs.globSync.mockReturnValue(['/test/tokens.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import { createTheme } from "@plumeria/core"; export const T = createTheme({ primary: "#fff" });',
      );

      const result = scanAll();
      const keys = Object.keys(result.themeTable);
      expect(keys.some((key) => key.endsWith('-T'))).toBe(true);
    });

    it('should scan for viewTransition', () => {
      mockedFs.globSync.mockReturnValue(['/test/vt.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; export const slide = css.viewTransition({ group: { animationDuration: "0.3s" } });',
      );

      const result = scanAll();
      const keys = Object.keys(result.viewTransitionHashTable);
      expect(keys.some((key) => key.endsWith('-slide'))).toBe(true);
      expect(result.viewTransitionObjectTable).toBeDefined();
    });

    it('should handle non-exported createStatic declarations', () => {
      mockedFs.globSync.mockReturnValue(['/test/local.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const C = css.createStatic({ size: "large" });',
      );

      const result = scanAll();

      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((key) => key.endsWith('-C'));
      expect(cKey).toBeDefined();
      expect(result.staticTable[cKey!]).toEqual({ size: 'large' });
    });

    it('should handle non-exported keyframes declarations', () => {
      mockedFs.globSync.mockReturnValue(['/test/local-kf.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });',
      );

      const result = scanAll();

      const keys = Object.keys(result.keyframesHashTable);
      expect(keys.some((key) => key.endsWith('-fade'))).toBe(true);
    });

    it('should handle non-exported createTheme declarations', () => {
      mockedFs.globSync.mockReturnValue(['/test/local-tokens.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const T = css.createTheme({ primary: "#fff" });',
      );

      const result = scanAll();

      const keys = Object.keys(result.themeTable);
      expect(keys.some((key) => key.endsWith('-T'))).toBe(true);
    });

    it('should handle non-exported viewTransition declarations', () => {
      mockedFs.globSync.mockReturnValue(['/test/local-vt.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const slide = css.viewTransition({ group: { animationDuration: "0.3s" } });',
      );

      const result = scanAll();

      const keys = Object.keys(result.viewTransitionHashTable);
      expect(keys.some((key) => key.endsWith('-slide'))).toBe(true);
    });

    it('should skip files without target definition', () => {
      mockedFs.globSync.mockReturnValue(['/test/normal.ts'] as any);
      mockedFs.readFileSync.mockReturnValue('const x = 1;');

      const resultKeyframes = scanAll();
      expect(Object.keys(resultKeyframes.keyframesHashTable)).toHaveLength(0);

      const resultConsts = scanAll();
      expect(Object.keys(resultConsts.staticTable)).toHaveLength(0);

      const resultTokens = scanAll();
      expect(Object.keys(resultTokens.themeTable)).toHaveLength(0);

      const resultViewTransition = scanAll();
      expect(
        Object.keys(resultViewTransition.viewTransitionHashTable),
      ).toHaveLength(0);
    });

    it('should skip directories', () => {
      mockedFs.globSync.mockReturnValue(['/test/dir'] as any);
      mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as any);

      const result = scanAll();

      expect(Object.keys(result.keyframesHashTable)).toHaveLength(0);
    });

    it('should scan for create', () => {
      mockedFs.globSync.mockReturnValue(['/test/create.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; export const style = css.create({ color: "red" });',
      );

      const result = scanAll();
      const keys = Object.keys(result.createHashTable);
      expect(keys.some((key) => key.endsWith('-style'))).toBe(true);
      expect(result.createObjectTable).toBeDefined();
    });

    it('should scan for variants', () => {
      mockedFs.globSync.mockReturnValue(['/test/variants.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; export const btn = css.variants({ variants: { size: { sm: { padding: 4 } } } });',
      );

      const result = scanAll();
      const keys = Object.keys(result.variantsHashTable);
      expect(keys.some((key) => key.endsWith('-btn'))).toBe(true);
      expect(result.variantsObjectTable).toBeDefined();
    });

    it('should resolve variables from create table', () => {
      mockedFs.globSync.mockReturnValue(['/test/resolve.ts'] as any);
      // We need a case where resolveVariable is called.
      // resolveVariable is passed to objectExpressionToObject.
      // It is called when value is Identifier or MemberExpression.
      mockedFs.readFileSync.mockReturnValue(
        `
         import * as css from "@plumeria/core";
         const base = css.create({ color: "red" });
         const derived = css.createStatic({
           ref: base.color
         });
         `,
      );

      const result = scanAll();
      // "derived" static table entry should have { ref: "red" }
      const keys = Object.keys(result.staticTable);
      const derivedKey = keys.find((k) => k.endsWith('-derived'));
      expect(derivedKey).toBeDefined();
      expect(result.staticTable[derivedKey!]).toEqual({ ref: 'red' });
    });

    it('should resolve variants from variants table', () => {
      mockedFs.globSync.mockReturnValue(['/test/resolve_var.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        `
         import * as css from "@plumeria/core";
         const btn = css.variants({ variants: {} });
         const derived = css.createStatic({
           ref: btn
         });
         `,
      );
      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const derivedKey = keys.find((k) => k.endsWith('-derived'));
      expect(derivedKey).toBeDefined();
      // Expect ref to start with 'vr-'
      const val = result.staticTable[derivedKey!] as any;
      expect(val.ref).toMatch(/^vr-/);
    });

    it('should handle aliased named import', () => {
      mockedFs.globSync.mockReturnValue(['/test/aliased.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import { createStatic as cs } from "@plumeria/core"; export const C = cs({ color: "green" });',
      );
      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((k) => k.endsWith('-C'));
      expect(result.staticTable[cKey!]).toEqual({ color: 'green' });
    });

    it('should handle named css import', () => {
      // Covers objectName === 'css' path
      mockedFs.globSync.mockReturnValue(['/test/named_css.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import { css } from "@plumeria/core"; export const C = css.createStatic({ color: "purple" });',
      );
      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((k) => k.endsWith('-C'));
      expect(result.staticTable[cKey!]).toEqual({ color: 'purple' });
    });

    it('should support create reference as value', () => {
      mockedFs.globSync.mockReturnValue(['/test/ref.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const base = css.create({ color: "red" }); const ref = css.createStatic({ link: base });',
      );
      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const refKey = keys.find((k) => k.endsWith('-ref'));
      const val = result.staticTable[refKey!] as any;
      expect(val.link).toMatch(/^cr-/);
    });

    it('should handle unresolved variables in createStatic', () => {
      mockedFs.globSync.mockReturnValue(['/test/unresolved.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import * as css from "@plumeria/core"; const C = css.createStatic({ color: unknownVar });',
      );
      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((k) => k.endsWith('-C'));
      expect(result.staticTable[cKey!]).toEqual({
        color: '[unresolved identifier]',
      });
    });

    it('should use cache on second run', () => {
      const mtimeMs = 12345;
      mockedFs.globSync.mockReturnValue(['/test/cache.ts'] as any);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
        mtimeMs,
      } as any);
      mockedFs.readFileSync.mockReturnValue(
        `import * as css from "@plumeria/core";
         export const C = css.createStatic({ color: "red" });
         export const T = css.createTheme({ p: 1 });
         export const S = css.create({ c: "blue" });
         export const V = css.variants({ variants: {} });
         export const K = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
         export const VT = css.viewTransition({ group: { name: "none" } });
        `,
      );

      // First run
      scanAll();

      // Second run - should use cache
      mockedFs.readFileSync.mockReturnValue('INVALID CONTENT');
      const result = scanAll();

      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((k) => k.endsWith('-C'));
      expect(result.staticTable[cKey!]).toEqual({ color: 'red' });

      // Check other tables are restored
      const themeKeys = Object.keys(result.themeTable);
      expect(themeKeys.some((k) => k.endsWith('-T'))).toBe(true);

      const createKeys = Object.keys(result.createHashTable);
      expect(createKeys.some((k) => k.endsWith('-S'))).toBe(true);

      const variantKeys = Object.keys(result.variantsHashTable);
      expect(variantKeys.some((k) => k.endsWith('-V'))).toBe(true);

      const kfKeys = Object.keys(result.keyframesHashTable);
      expect(kfKeys.some((k) => k.endsWith('-K'))).toBe(true);

      const vtKeys = Object.keys(result.viewTransitionHashTable);
      expect(vtKeys.some((k) => k.endsWith('-VT'))).toBe(true);
    });

    it('should handle default import', () => {
      mockedFs.globSync.mockReturnValue(['/test/default.ts'] as any);
      mockedFs.readFileSync.mockReturnValue(
        'import css from "@plumeria/core"; export const C = css.createStatic({ color: "blue" });',
      );

      const result = scanAll();
      const keys = Object.keys(result.staticTable);
      const cKey = keys.find((k) => k.endsWith('-C'));
      expect(result.staticTable[cKey!]).toEqual({ color: 'blue' });
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

  it('should extract keyframes, viewTransition, create and theme styles', () => {
    const extracted: string[] = [];

    // Setup matching theme table
    const themeObj = { primary: 'blue' };
    const themeHash = genBase36Hash(themeObj, 1, 8);
    tables.themeTable['T'] = themeObj;
    tables.createThemeObjectTable[themeHash] = themeObj;

    // Setup create table
    const createHash = 'myhash';
    tables.createObjectTable[createHash] = { color: 'red' };

    extractOndemandStyles(
      {
        a: 'kf-abc',
        b: 'vt-def',
        c: 'var(--color)',
        d: `cr-${createHash}`,
        nested: {
          d: 'kf-abc',
        },
      },
      extracted,
    );

    // transpile の戻りは parser 側で共通の styleSheet を返すため
    expect(extracted.length).toBeGreaterThan(0);
  });

  it('should handle circular objects without crashing', () => {
    const extracted: string[] = [];
    const obj: any = { a: 'val' };
    obj.b = obj; // Circular reference

    extractOndemandStyles(obj, extracted);
    expect(extracted).toHaveLength(0);
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
