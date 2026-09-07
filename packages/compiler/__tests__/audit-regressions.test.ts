import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compileCSS } from '../src/index';

const directory = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-compiler-audit-')),
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

describe('compiler: audit regressions', () => {
  it('unwraps TypeScript wrappers around style definitions and uses', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: { color: 'purple' } } satisfies Record<string, css.CSSProperties>);
        export const App = () => <div classStyle={(styles.box as css.Style)!} />;
      `,
    });

    expect(compile(['App.tsx'])).toContain('color: purple');
  });

  it('walks nested and conditional style arrays, including css.use', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ a: { color: 'red' }, b: { padding: 4 } });
        export const App = ({ on }: { on: boolean }) => <div classStyle={[[styles.a], on ? [styles.b] : undefined]} />;
        export const Other = () => <div className={css.use([styles.a, styles.b])} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 4px');
  });

  it('accepts an omitted optional style prop read off the props object', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        export const Card = (props: { cardStyle?: css.Style }) => <div classStyle={props.cardStyle} />;
        export const App = () => <Card />;
      `,
    });

    expect(() => compile(['App.tsx'])).not.toThrow();
  });

  it('walks an array handed to a component prop', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ a: { color: 'red' }, b: { padding: 4 } });
        export const App = () => <Card boxStyle={[styles.a, styles.b]} />;
        export const Toggled = ({ on }: { on: boolean }) => <Card boxStyle={on ? [styles.a] : [styles.b]} />;
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: red');
    expect(output).toContain('padding: 4px');
  });

  it('reports an unsupported at-rule passed to createTheme', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        export const theme = css.createTheme('@nonsense', { color: { default: 'red', theme: 'blue' } });
        export const App = () => <div classStyle={{ color: theme.color }} />;
      `,
    });

    expect(() => compile(['App.tsx'])).toThrow(
      /Unsupported at-rule: "@nonsense"/,
    );
  });

  it('ignores holes in style arrays', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ a: { color: 'red' }, b: { padding: 4 } });
        export const App = () => <div classStyle={[styles.a,,styles.b]} />;
      `,
    });

    expect(compile(['App.tsx'])).toEqual(expect.stringContaining('color: red'));
    expect(compile(['App.tsx'])).toContain('padding: 4px');
  });

  it('resolves named dynamic expressions without static-evaluation errors', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ space: ({ n }: { n: number }) => ({ padding: n }) });
        export const App = ({ n }: { n: number }) => <div classStyle={styles.space({ n: n + 1 })} />;
      `,
    });

    expect(compile(['App.tsx'])).toContain('var(--');
  });

  it('keeps same-named aliases scoped to their declaration order', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const styles = css.create({ box: { color: 'purple' }, other: { backgroundColor: 'orange' } });
        export const First = () => { const alias = styles.box; return <div classStyle={alias} />; };
        export const Second = () => { const alias = styles.other; return <div classStyle={alias} />; };
      `,
    });

    const output = compile(['App.tsx']);
    expect(output).toContain('color: purple');
    expect(output).toContain('background-color: orange');
  });

  it('accepts optional Style props when they are omitted', () => {
    writeProject({
      'Card.tsx': `
        import * as css from '@plumeria/core';
        type CardProps = { cardStyle?: css.Style };
        const styles = css.create({ base: { backgroundColor: 'orange' } });
        export const Card = ({ cardStyle }: CardProps) => <div classStyle={[styles.base, cardStyle]} />;
      `,
      'App.tsx': `
        import { Card } from './Card';
        export const App = () => <Card />;
      `,
    });

    const output = compile();
    expect(output).toContain('background-color: orange');
  });

  it('tracks renamed Style props through conditional expressions', () => {
    writeProject({
      'Card.tsx': `
        import * as css from '@plumeria/core';
        type CardProps = { cardStyle?: css.Style; active: boolean };
        export const Card = ({ cardStyle: incoming, active }: CardProps) => <div classStyle={active && (incoming)} />;
      `,
      'App.tsx': `
        import * as css from '@plumeria/core';
        import { Card } from './Card';
        const styles = css.create({ box: { color: 'purple' } });
        export const App = () => <Card cardStyle={styles.box} active />;
      `,
    });

    expect(compile()).toContain('color: purple');
  });

  it('keeps dynamic defaults independent from outer constants', () => {
    writeProject({
      'App.tsx': `
        import * as css from '@plumeria/core';
        const n = 9;
        const styles = css.create({ space: (n = 4) => ({ padding: n }) });
        export const App = () => <div classStyle={styles.space()} />;
      `,
    });

    expect(compile(['App.tsx'])).toContain('4px');
  });

  it('uses options.cwd for imported style scanning', () => {
    writeProject({
      'styles.ts': `
        import * as css from '@plumeria/core';
        export const styles = css.create({ box: { color: 'purple' } });
      `,
      'App.tsx': `
        import { styles } from './styles';
        export const App = () => <div classStyle={styles.box} />;
      `,
    });

    const previous = process.cwd();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-outside-'));
    try {
      process.chdir(outside);
      expect(compile(['App.tsx'])).toContain('color: purple');
    } finally {
      process.chdir(previous);
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

it('restores the outer alias after a component-local shadow', () => {
  writeProject({
    'App.tsx': `import * as css from '@plumeria/core'; const s=css.create({a:{color:'red'},b:{color:'blue'}});const alias=s.a;export const First=()=>{const alias=s.b;return <div classStyle={alias}/>};export const Second=()=> <div classStyle={alias}/>;`,
  });
  const output = compile();
  expect(output).toContain('color: red');
  expect(output).toContain('color: blue');
});
it.each(['{cardStyle?:css.Style}', 'Props'])(
  'preserves omitted prop defaults with %s',
  (type) => {
    writeProject({
      'App.tsx':
        `import * as css from '@plumeria/core'; interface Base {cardStyle?:css.Style};interface Props extends Base {}; const s=css.create({a:{color:'red'}});export const Card=({cardStyle=s.a}:` +
        type +
        `)=><div classStyle={cardStyle}/>;export const App=()=> <Card/>;`,
    });
    expect(compile()).toContain('color: red');
  },
);
it('accepts omitted interface Style props without defaults', () => {
  writeProject({
    'App.tsx': `import * as css from '@plumeria/core'; interface Props {cardStyle?:css.Style};export const Card=({cardStyle}:Props)=><div classStyle={cardStyle}/>;export const App=()=> <Card/>;`,
  });
  expect(compile()).toBe('');
});
it('resolves tsconfig paths from options.cwd', () => {
  writeProject({
    'tsconfig.json': JSON.stringify({
      compilerOptions: { paths: { '@/*': ['./*'] } },
    }),
    'styles.ts': `import * as css from '@plumeria/core';export const s=css.create({a:{color:'red'}});`,
    'App.tsx': `import {s} from '@/styles';export const App=()=> <div classStyle={s.a}/>;`,
  });
  expect(compile(['App.tsx'])).toContain('color: red');
});

it('emits both default and supplied prop styles', () => {
  writeProject({
    'App.tsx': `import * as css from '@plumeria/core';const s=css.create({a:{color:'red'},b:{color:'blue'}});export const Card=({cardStyle=s.a}:{cardStyle?:css.Style})=><div classStyle={cardStyle}/>;export const App=()=> <><Card/><Card cardStyle={s.b}/></>;`,
  });
  const output = compile();
  expect(output).toContain('color: red');
  expect(output).toContain('color: blue');
});
