import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compileCSS } from '../src/index';

const directory = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-compiler-coverage-')),
);

const writeProject = (files: Record<string, string>) => {
  for (const entry of fs.readdirSync(directory)) {
    fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
  }
  for (const [name, source] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), source, 'utf8');
  }
};

const compile = (include: string[] = ['**/*.{ts,tsx}']) =>
  compileCSS({ cwd: directory, include, exclude: [] });

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

describe('compiler index coverage', () => {
  it('supports named and default core imports', () => {
    writeProject({
      'App.tsx': `
        import core, { create as make, use as apply } from '@plumeria/core';
        const first = make({ box: { color: 'red' } });
        const second = core.create({ box: { padding: 2 } });
        export const App = () => <div className={apply([first.box, second.box])} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 2px');
  });

  it('extracts imported create members from component attributes', () => {
    writeProject({
      'styles.ts': `
        import * as css from '@plumeria/core';
        export const styles = css.create({ a: { color: 'red' }, b: { padding: 3 } });
      `,
      'App.tsx': `
        import { styles } from './styles';
        declare const key: 'a' | 'b';
        export const App = () => <Card one={styles.a} two={styles['b']} three={styles[key]} four={styles} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 3px');
  });

  it('extracts local computed members and complete style groups', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ a: { color: 'red' }, b: { padding: 3 }, empty: null });
        declare const key: 'a' | 'b';
        export const App = () => <Card one={styles['a']} two={styles[key]} three={styles} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 3px');
  });

  it('resolves complete and computed create groups as explicit styles', () => {
    writeProject({
      'styles.ts': `
        import * as css from '@plumeria/core';
        export const imported = css.create({ a: { color: 'red' }, b: { padding: 3 } });
      `,
      'App.tsx': `
        import * as css from '@plumeria/core';
        import { imported } from './styles';
        const local = css.create({ a: { margin: 2 } });
        declare const key: 'a' | 'b';
        export const Local = () => <div classStyle={local} />;
        declare const active: boolean;
        export const Imported = () => <div classStyle={[imported, imported[key], active && imported[key]]} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 3px');
  });

  it('rejects computed dynamic function members as unresolved', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: (color: string) => ({ color }) });
        export const App = () => <div classStyle={styles['box']('red')} />;
      `,
    });

    expect(compile(['App.tsx'])).toBe('');
  });

  it('uses imported animation and view-transition definitions', () => {
    writeProject({
      'styles.ts': `
        import * as css from '@plumeria/core';
        export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
        export const swap = css.viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } });
      `,
      'App.tsx': `
        import * as css from '@plumeria/core';
        import { fade, swap } from './styles';
        const styles = css.create({ box: { animationName: fade, viewTransitionName: swap } });
        export const App = () => <div classStyle={styles.box} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('@keyframes');
    expect(output).toContain('view-transition');
  });

  it('handles renamed destructured defaults', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: { color: 'red' } });
        export const Card = ({ cardStyle: incoming = styles.box }: { cardStyle?: css.Style }) => <div classStyle={incoming} />;
        export const App = () => <Card />;
      `,
    });

    expect(compile(['App.tsx'])).toContain('color: red');
  });

  it('finds component prop styles for a use call outside a component', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: { color: 'red' } });
        declare const cardStyle: css.Style;
        const className = css.use(cardStyle);
        export const App = () => <Card cardStyle={styles.box} className={className} />;
      `,
    });

    expect(compile(['App.tsx'])).toContain('color: red');
  });

  it('validates malformed named dynamic calls', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: ({ color }: { color: string }) => ({ color }) });
        export const App = () => <div classStyle={styles.box('red')} />;
      `,
    });

    expect(() => compile(['App.tsx'])).toThrow(/takes one object argument/);
  });

  it('validates missing named dynamic arguments', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: ({ color }: { color: string }) => ({ color }) });
        export const App = () => <div classStyle={styles.box({})} />;
      `,
    });

    expect(() => compile(['App.tsx'])).toThrow(/leaves "color" unset/);
  });

  it('folds shorthand and positional object arguments', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const color = 'red';
        const named = css.create({ box: ({ color }: { color: string }) => ({ color }) });
        const positional = css.create({ box: (color: string) => ({ color }) });
        export const App = () => <div classStyle={[named.box({ color }), positional.box({ color: 'blue' })]} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: blue');
  });

  it('reports an unreadable createTheme selector used as a call', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        declare const selector: string;
        css.createTheme(selector, { color: { default: 'red', theme: 'blue' } });
      `,
    });

    expect(() => compile(['App.tsx'])).toThrow(/needs a selector/);
  });

  it('reports an unsupported createTheme call at-rule', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        css.createTheme('@unknown', { color: { default: 'red', theme: 'blue' } });
      `,
    });

    expect(() => compile(['App.tsx'])).toThrow(/Unsupported at-rule/);
  });

  it('ignores JSX namespaced elements as component usage sites', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: { color: 'red' } });
        export const App = () => <svg:path data-style={styles.box} />;
      `,
    });

    expect(compile(['App.tsx'])).toBe('');
  });
});
