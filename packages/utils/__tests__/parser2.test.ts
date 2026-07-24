import fs from 'node:fs';
import path from 'node:path';
import { t, getFileDependencies, resolveExport, scanAll } from '../src/parser';
import { orderMediaLast } from '../src/optimizer';

describe('parser2 coverage completion tests', () => {
  const tmpDir = path.join(__dirname, '__tmp_parser2_test__');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('t.isArrowFunctionExpression and t.isFunctionExpression', () => {
    expect(
      t.isArrowFunctionExpression({ type: 'ArrowFunctionExpression' }),
    ).toBe(true);
    expect(t.isArrowFunctionExpression({ type: 'Identifier' })).toBe(false);
    expect(t.isArrowFunctionExpression(null)).toBe(false);

    expect(t.isFunctionExpression({ type: 'FunctionExpression' })).toBe(true);
    expect(t.isFunctionExpression({ type: 'Identifier' })).toBe(false);
    expect(t.isFunctionExpression(null)).toBe(false);
  });

  test('getFileDependencies for file cache and repeat scan', () => {
    const fileA = path.join(tmpDir, 'depA.ts');
    const fileB = path.join(tmpDir, 'depB.ts');
    const fileC = path.join(tmpDir, 'depC.ts');

    fs.writeFileSync(fileB, `import '@plumeria/core'; export const b = 1;`);
    fs.writeFileSync(
      fileC,
      `import '@plumeria/core'; import { b } from './depB'; export const c = b;`,
    );
    fs.writeFileSync(
      fileA,
      `import '@plumeria/core'; import { c } from './depC'; export const a = c;`,
    );

    scanAll();
    resolveExport(fileA, 'a');

    // Update fileA mtime and scan again to trigger prevDependencies in updateDependencyEdges & duplicate entry skip
    fs.writeFileSync(
      fileA,
      `import '@plumeria/core'; import { c } from './depC'; export const a = c; // repeat`,
    );
    scanAll();

    const deps = getFileDependencies(fileA);
    expect(deps.length).toBeGreaterThan(0);

    const depsVisited = getFileDependencies(fileA);
    expect(depsVisited).toEqual(deps);
  });

  test('extractAndCacheExports & resolveExport for functions, classes, re-exports and star exports', () => {
    const subFile = path.join(tmpDir, 'subExport.ts');
    const mainFile = path.join(tmpDir, 'mainExport.ts');
    const defaultAnonFile = path.join(tmpDir, 'defaultAnon.ts');
    const reExportImpFile = path.join(tmpDir, 'reExportImp.ts');
    const exportNamedSourceFile = path.join(tmpDir, 'exportNamedSource.ts');
    const exportAllSourceFile = path.join(tmpDir, 'exportAllSource.ts');
    const destructureFile = path.join(tmpDir, 'destructureExport.ts');
    const unresolvableFile = path.join(tmpDir, 'unresolvableExports.ts');
    const namedReExportFile = path.join(tmpDir, 'namedReExportSource.ts');

    fs.writeFileSync(
      subFile,
      `
      import '@plumeria/core';
      export function subFunc() {}
      export class SubClass {}
      export const internalVar = 100;
      const unexported = 200;
      export { unexported as reExportedVar };
      export default function defaultSubFunc() {}
      `,
    );

    fs.writeFileSync(
      defaultAnonFile,
      `
      import '@plumeria/core';
      export default function() {}
      `,
    );

    fs.writeFileSync(
      reExportImpFile,
      `
      import '@plumeria/core';
      import { subFunc } from './subExport';
      export default subFunc;
      `,
    );

    fs.writeFileSync(
      exportNamedSourceFile,
      `
      import '@plumeria/core';
      export { SubClass } from './subExport';
      `,
    );

    fs.writeFileSync(
      exportAllSourceFile,
      `
      import '@plumeria/core';
      export * from './subExport';
      `,
    );

    fs.writeFileSync(
      namedReExportFile,
      `
      import '@plumeria/core';
      export { subFunc as reSubFunc } from './subExport';
      `,
    );

    fs.writeFileSync(
      destructureFile,
      `
      import '@plumeria/core';
      export const [destructA] = [10];
      export const { destructB } = { destructB: 20 };
      `,
    );

    fs.writeFileSync(
      unresolvableFile,
      `
      import '@plumeria/core';
      export { foo } from './non-existent-module-xyz';
      export * from './non-existent-module-abc';
      `,
    );

    fs.writeFileSync(
      mainFile,
      `
      import '@plumeria/core';
      import { subFunc, internalVar } from './subExport';
      export * from './subExport';
      export { SubClass as RenamedClass } from './subExport';
      export { internalVar as aliasImported };
      export default 123;
      `,
    );

    scanAll();

    const resFunc = resolveExport(mainFile, 'subFunc');
    expect(resFunc).toEqual({ filePath: subFile, localName: 'subFunc' });

    const resStar = resolveExport(exportAllSourceFile, 'subFunc');
    expect(resStar).toEqual({ filePath: subFile, localName: 'subFunc' });

    const resNamedRe = resolveExport(namedReExportFile, 'reSubFunc');
    expect(resNamedRe).toEqual({ filePath: subFile, localName: 'subFunc' });

    const resClass = resolveExport(mainFile, 'RenamedClass');
    expect(resClass).toEqual({ filePath: subFile, localName: 'SubClass' });

    const resAliasImported = resolveExport(mainFile, 'aliasImported');
    expect(resAliasImported).toEqual({
      filePath: subFile,
      localName: 'internalVar',
    });

    const resAnonDefault = resolveExport(defaultAnonFile, 'default');
    expect(resAnonDefault).toEqual({
      filePath: defaultAnonFile,
      localName: 'default',
    });

    const resMainDefault = resolveExport(mainFile, 'default');
    expect(resMainDefault).toEqual({
      filePath: mainFile,
      localName: 'default',
    });

    const resReExportImp = resolveExport(reExportImpFile, 'default');
    expect(resReExportImp).toEqual({ filePath: subFile, localName: 'subFunc' });

    const resDir = resolveExport(tmpDir, 'anything');
    expect(resDir).toBeNull();
  });

  test('Plumeria imports, selector createTheme, and JSX attributes (covering 1424, 1433, 1449, 1512, 1650, 1846, 1854)', () => {
    const componentFile = path.join(tmpDir, 'compExport.tsx');
    const usageFile = path.join(tmpDir, 'compUsage.tsx');

    fs.writeFileSync(
      componentFile,
      `
      import * as plumeriaNs from '@plumeria/core';
      import defaultPlumeria from '@plumeria/core';
      import { css, createTheme } from '@plumeria/core';
      export * from './subExport';

      export const s1 = plumeriaNs.css.create({ a: { color: 'red' } });
      export const s2 = defaultPlumeria.css.create({ b: { color: 'green' } });

      export const themeWithSelector = createTheme('.theme-class', {
        themeColor: 'blue',
      });

      export function ExportedTarget(props: any) {
        return <div />;
      }
      `,
    );

    fs.writeFileSync(
      usageFile,
      `
      import { css } from '@plumeria/core';
      import myDefaultImport from './depB';
      import { ExportedTarget } from './compExport';

      const styles = css.create({
        box: { color: 'green' },
      });

      export function Usage() {
        return (
          <div>
            <ExportedTarget style={styles.box} label="text-attribute" isPrimary />
            <ExportedTarget style={styles['box']} />
          </div>
        );
      }
      `,
    );

    scanAll();
  });

  test('Cross-file imports for createStatic, createTheme, keyframes, viewTransition & static bracket access (covering 1018, 1022, 1466, 1474, 1482, 1491)', () => {
    const providerFile = path.join(tmpDir, 'styleProvider.ts');
    const consumerFile = path.join(tmpDir, 'styleConsumer.ts');

    fs.writeFileSync(
      providerFile,
      `
      import { css, keyframes, createTheme, viewTransition } from '@plumeria/core';

      export const myStatic = css.createStatic({
        card: { padding: '16px' },
      });

      export const myTheme = createTheme({
        color: 'red',
      });

      export const myAnimation = keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 },
      });

      export const myVT = viewTransition({
        old: { opacity: 1 },
        new: { opacity: 0 },
      });
      `,
    );

    fs.writeFileSync(
      consumerFile,
      `
      import { css } from '@plumeria/core';
      import { myStatic, myTheme, myAnimation, myVT } from './styleProvider';

      const styles = css.create({
        box: {
          color: myTheme.color,
          animationName: myAnimation,
          padding: myStatic['card'],
        },
      });

      export function App() {
        return (
          <div style={myStatic.card}>
            <div style={styles.box} />
          </div>
        );
      }
      `,
    );

    scanAll();
  });

  test('JSX style property resolution in scan (array, conditionals, binary &&, parenthesis, local component, non-existent props) (covering 1735, 1747, 1774)', () => {
    const file = path.join(tmpDir, 'jsxStyles.tsx');
    fs.writeFileSync(
      file,
      `
      import { css } from '@plumeria/core';

      const styles = css.create({
        box1: { color: 'red' },
        box2: { color: 'blue' },
      });

      const LocalComp = (props: any) => <div />;

      export function App(props: { cond: boolean }) {
        return (
          <div>
            <LocalComp style={[styles.box1, styles.box2, true ? styles.box1 : styles.box2, false ? styles.box1 : styles.box2, true && styles.box1, false && styles.box1, (styles.box1)]} />
            <LocalComp style={props.cond ? styles.box1 : styles.box2} />
            <LocalComp style={true ? styles.box1 : styles.box2} />
            <LocalComp style={props.cond && styles.box1} />
            <LocalComp style={true && styles.box1} />
            <LocalComp style={(styles.box1)} />
            <LocalComp style={(styles as any).nonExistentProp} />
            <LocalComp style={12345} />
          </div>
        );
      }
      `,
    );

    const tables = scanAll();
    expect(tables).toBeDefined();
  });

  test('removeFileEntries delete propTable[propName] and delete table[compKey]', () => {
    const fileTarget = path.join(tmpDir, 'targetCompClean.tsx');
    const fileA = path.join(tmpDir, 'compConsumerCleanA.tsx');
    const fileB = path.join(tmpDir, 'compConsumerCleanB.tsx');

    fs.writeFileSync(
      fileTarget,
      `import '@plumeria/core'; export function Target(props: any) { return <div />; }`,
    );
    fs.writeFileSync(
      fileA,
      `
      import { css } from '@plumeria/core';
      import { Target } from './targetCompClean';
      const styles = css.create({ boxA: { margin: 10 } });
      export function ConsumerA() { return <Target style={styles.boxA} />; }
      `,
    );
    fs.writeFileSync(
      fileB,
      `
      import { css } from '@plumeria/core';
      import { Target } from './targetCompClean';
      const styles = css.create({ boxB: { padding: 20 } });
      export function ConsumerB() { return <Target style={styles.boxB} />; }
      `,
    );

    scanAll();

    fs.writeFileSync(
      fileA,
      `
      import { css } from '@plumeria/core';
      const dummy = css.create({ x: { display: 'block' } });
      export function ConsumerA() { return <div />; }
      `,
    );
    scanAll();

    fs.writeFileSync(
      fileB,
      `
      import { css } from '@plumeria/core';
      const dummy = css.create({ y: { display: 'inline' } });
      export function ConsumerB() { return <div />; }
      `,
    );
    scanAll();
  });

  test('isMediaRule unterminated comment edge case in optimizer', () => {
    const unclosedCommentCSS =
      '/* unterminated comment @media (min-width: 0px) {}';
    const result = orderMediaLast([unclosedCommentCSS]);
    expect(result).toEqual([unclosedCommentCSS]);
  });
});
