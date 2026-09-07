import { transformSync } from '@swc/core';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getStyleRecords } from '@plumeria/utils';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'plumeria-loader-audit-'),
);
const run = (source: string) =>
  new Promise<string>((resolve, reject) => {
    loader.call(
      {
        resourcePath: path.join(directory, 'fixture.tsx'),
        context: directory,
        rootContext: directory,
        async: () => (error, output) =>
          error ? reject(error) : resolve(output!),
        addDependency: () => {},
        clearDependencies: () => {},
      },
      source,
    );
  });
const prefix = `import * as css from '@plumeria/core';`;
const classHash = (style: Record<string, any>) =>
  getStyleRecords(style)[0].hash;

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

describe('turbopack-loader: audit regressions', () => {
  it.each(['box', '(box)', 'on && box', 'on ? box : styles.other'])(
    'resolves a style alias inside %s',
    async (expression) => {
      const output = await run(
        prefix +
          `const styles=css.create({box:{color:'purple'},other:{backgroundColor:'orange'}}); const box=styles.box; export const App=({on}:{on:boolean})=><div classStyle={${expression}}/>;`,
      );
      expect(output).toContain(classHash({ color: 'purple' }));
    },
  );

  it('applies an array default when the style prop is omitted', async () => {
    const output = await run(
      prefix +
        `const s=css.create({a:{color:'red'},b:{padding:4}}); export const Card=({cardStyle=[s.a,s.b]}:{cardStyle?:css.Style})=><div classStyle={cardStyle}/>; export const App=()=> <Card/>;`,
    );
    expect(output).toContain(classHash({ color: 'red' }));
    expect(output).toContain(classHash({ padding: 4 }));
  });

  it('accepts an omitted optional style prop read off the props object', async () => {
    const output = await run(
      prefix +
        `export const Card=(props:{cardStyle?:css.Style})=><div classStyle={props.cardStyle}/>; export const App=()=> <Card/>;`,
    );
    expect(output).toContain('className');
  });

  it('keeps same-named local aliases separate', async () => {
    const output = await run(
      prefix +
        `const styles=css.create({box:{color:'purple'},other:{backgroundColor:'orange'}}); export const First=()=>{const alias=styles.box;return <div classStyle={alias}/>;}; export const Second=()=>{const alias=styles.other;return <div classStyle={alias}/>;};`,
    );
    expect(output).toContain(classHash({ color: 'purple' }));
    expect(output).toContain(classHash({ backgroundColor: 'orange' }));
  });

  it('accepts an omitted optional Style prop', async () => {
    const output = await run(
      prefix +
        `type CardProps={cardStyle?:css.Style}; const styles=css.create({base:{backgroundColor:'orange'}}); export const Card=({cardStyle}:CardProps)=><div classStyle={[styles.base,cardStyle]}/>; export const App=()=> <Card />;`,
    );
    expect(output).toContain(classHash({ backgroundColor: 'orange' }));
  });

  it('does not let an outer const shadow a dynamic default', async () => {
    const common = `const styles=css.create({space:(n=4)=>({padding:n})}); export const App=()=> <div classStyle={styles.space()}/>;`;
    const control = await run(prefix + common);
    const shadowed = await run(prefix + `const n=9;` + common);
    expect(shadowed.match(/className=\{"([^"]+)"/i)?.[1]).toBe(
      control.match(/className=\{"([^"]+)"/i)?.[1],
    );
  });
});

it('uses the outer binding after a local alias shadow', async () => {
  const output = await run(
    prefix +
      `const s=css.create({a:{color:'red'},b:{color:'blue'}});const alias=s.a;export const First=()=>{const alias=s.b;return <div classStyle={alias}/>};export const Second=()=> <div classStyle={alias}/>;`,
  );
  expect(output).toContain(classHash({ color: 'red' }));
});
it('preserves defaults on interface Style props', async () => {
  const output = await run(
    prefix +
      `interface Props {cardStyle?:css.Style};const s=css.create({a:{color:'red'}});export const Card=({cardStyle=s.a}:Props)=><div classStyle={cardStyle}/>;export const App=()=> <Card/>;`,
  );
  expect(output).toContain(classHash({ color: 'red' }));
});

it('selects the default or supplied style at runtime', async () => {
  const source =
    prefix +
    `const s=css.create({a:{color:'red'},b:{color:'blue'}});export const Card=({cardStyle=s.a}:{cardStyle?:css.Style})=><div classStyle={cardStyle}/>;export const App=()=> <><Card/><Card cardStyle={s.b}/></>;`;
  const file = path.join(directory, 'fixture.tsx');
  fs.writeFileSync(file, source);
  const glob = jest.requireMock('@rust-gear/glob').globSync;
  glob.mockReturnValue([file]);
  try {
    const output = await run(source);
    const code = transformSync(output.replace(/^import .*\.css["'];$/gm, ''), {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        transform: { react: { runtime: 'classic' } },
      },
      module: { type: 'commonjs' },
    }).code;
    const exports: any = {};
    new Function('React', 'exports', code)(
      {
        createElement: (type: any, props: any, ...children: any[]) => ({
          type,
          props,
          children,
        }),
      },
      exports,
    );
    expect(exports.Card({}).props.className).toBe(classHash({ color: 'red' }));
    const tree = exports.App();
    const supplied = tree.children[1].props;
    expect(exports.Card(supplied).props.className).toBe(
      classHash({ color: 'blue' }),
    );
    expect(exports.Card({ cardStyle: null }).props.className).toBe('');
    expect(exports.Card({ cardStyle: false }).props.className).toBe('');
  } finally {
    glob.mockReturnValue([]);
  }
});
