import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const files: string[] = [];

// The definition file is the one compiled; the caller file is only scanned, so
// the style it hands over has to be found through componentPropsTable.
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('definition.tsx')
      ? [files[0]]
      : files,
  ),
}));

import { compileCSS } from '../src/index';

let fixtureCount = 0;

// A style reaching a component through a prop is the same style whichever way
// the component is written, and whichever way the caller imports it. Every form
// here is one React accepts, so every one has to carry the rule into the sheet.
const compile = (definition: string, importLine: string) => {
  const id = fixtureCount++;
  const defPath = path.join(FIXTURE_DIR, `definition-${id}.tsx`);
  const callerPath = path.join(FIXTURE_DIR, `caller-${id}.tsx`);

  fs.writeFileSync(
    defPath,
    `import * as css from '@plumeria/core';\n${definition}\n`,
    'utf-8',
  );
  fs.writeFileSync(
    callerPath,
    `import * as css from '@plumeria/core';\n` +
      `${importLine.replace('./definition', `./definition-${id}`)}\n` +
      `const s = css.create({ boxed: { color: 'purple' } });\n` +
      `export const App = () => <Card cardStyle={s.boxed} />;\n`,
    'utf-8',
  );

  files.length = 0;
  files.push(defPath, callerPath);

  return compileCSS({ include: ['definition.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const named = `import { Card } from './definition';`;
const fromDefault = `import Card from './definition';`;

describe('compiler: the forms a component receiving a style can take', () => {
  it('reads the parameter of an arrow function assigned to a const', () => {
    const css = compile(
      `export const Card = (props: any) => <div className={css.use(props.cardStyle)} />;`,
      named,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of an exported function declaration', () => {
    const css = compile(
      `export function Card(props: any) { return <div className={css.use(props.cardStyle)} />; }`,
      named,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a function declaration exported below', () => {
    const css = compile(
      `function Card(props: any) { return <div className={css.use(props.cardStyle)} />; }\nexport { Card };`,
      named,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a default exported function declaration', () => {
    const css = compile(
      `export default function Card(props: any) { return <div className={css.use(props.cardStyle)} />; }`,
      fromDefault,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a default exported anonymous function', () => {
    const css = compile(
      `export default function (props: any) { return <div className={css.use(props.cardStyle)} />; }`,
      fromDefault,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a default exported arrow function', () => {
    const css = compile(
      `export default (props: any) => <div className={css.use(props.cardStyle)} />;`,
      fromDefault,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a const the default export names', () => {
    // The scanner keys this component as `default`, because the local name is
    // not an export of its own. The name the definition file knows it by has
    // to keep finding the styles the caller passed.
    const css = compile(
      `const Card = (props: any) => <div className={css.use(props.cardStyle)} />;\nexport default Card;`,
      fromDefault,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter of a component a call wraps', () => {
    // `memo`, `forwardRef` and any other wrapper leave the component a function
    // argument of a call, which is still the function whose parameter names the
    // styles handed to it.
    const css = compile(
      `import { memo } from 'react';\nexport const Card = memo((props: any) => <div className={css.use(props.cardStyle)} />);`,
      named,
    );
    expect(css).toContain('color: purple');
  });

  it('reads the parameter through nested wrappers', () => {
    const css = compile(
      `import { memo, forwardRef } from 'react';\nexport const Card = memo(forwardRef(({ cardStyle }: any, ref: any) => <div ref={ref} className={css.use(cardStyle)} />));`,
      named,
    );
    expect(css).toContain('color: purple');
  });

  it('reads a destructured parameter of a function declaration', () => {
    const css = compile(
      `export function Card({ cardStyle }: any) { return <div className={css.use(cardStyle)} />; }`,
      named,
    );
    expect(css).toContain('color: purple');
  });
});
