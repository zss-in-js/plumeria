import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

const DEFINITIONS = `import * as css from '@plumeria/core';
export const slide = css.viewTransitionClass({ old: { opacity: 0.5 } });
export const unused = css.viewTransitionClass({ old: { opacity: 0.1 } });
export const names = [slide, unused];
`;

const env = (dir: string, name: string) => {
  const filePath = path.join(dir, name);
  return {
    source: fs.readFileSync(filePath, 'utf8'),
    moduleId: filePath,
    filePath,
    root: dir,
    cwd: dir,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    addDependency: () => {},
  };
};

const namesOf = (code: string): string[] => {
  const head = 'export const names = ';
  const start = code.indexOf(head) + head.length;
  return JSON.parse(code.slice(start, code.indexOf(';', start)));
};

describe.each(implementations)('$name', ({ transformSource, compileCSS }) => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')));
    fs.writeFileSync(path.join(dir, 'definitions.ts'), DEFINITIONS);
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const compile = async (app: string) => {
    fs.writeFileSync(path.join(dir, 'app.tsx'), app);
    const { code: definitions } = await transformSource(
      env(dir, 'definitions.ts'),
    );
    const { code } = await transformSource(env(dir, 'app.tsx'));
    const css = compileCSS({
      include: ['*.ts', '*.tsx'],
      exclude: [],
      cwd: dir,
    });
    return { code, css, names: namesOf(definitions) };
  };

  it('emits a class used in a ViewTransition prop, written in place', async () => {
    const { code, css, names } =
      await compile(`import * as css from '@plumeria/core';
import { ViewTransition } from 'react';
import { slide } from './definitions';
export const A = () => <ViewTransition default={slide}><div /></ViewTransition>;
`);
    const [slide, unused] = names;
    expect(code).toContain(`default={"${slide}"}`);
    expect(css).toContain(
      `::view-transition-old(*.${slide}) {\n  opacity: 0.5;\n}`,
    );
    expect(css).not.toContain(unused);
  });

  it('emits each class of a condition, a fallback and a type map', async () => {
    const { css } = await compile(`import * as css from '@plumeria/core';
import { unstable_ViewTransition as VT } from 'react';
import { slide } from './definitions';
const fade = css.viewTransitionClass({ new: { opacity: 1 } });
const grow = css.viewTransitionClass({ group: { animationDuration: '1s' } });
export const A = ({ on, kind }: any) => (
  <VT enter={on ? slide : 'none'} exit={kind ?? fade} update={{ 'nav-back': grow, default: 'none' }}>
    <div />
  </VT>
);
`);
    expect(css).toContain('opacity: 0.5;');
    expect(css).toContain('opacity: 1;');
    expect(css).toContain('animation-duration: 1s;');
  });

  it('emits a shorthand in a type map and each class of a template', async () => {
    const { css } = await compile(`import * as css from '@plumeria/core';
import { ViewTransition } from 'react';
import { slide } from './definitions';
const fade = css.viewTransitionClass({ new: { opacity: 1 } });
const grow = css.viewTransitionClass({ group: { animationDuration: '1s' } });
export const A = () => (
  <ViewTransition update={{ grow }} share={\`\${slide} \${fade}\`}>
    <div />
  </ViewTransition>
);
`);
    expect(css).toContain('opacity: 0.5;');
    expect(css).toContain('opacity: 1;');
    expect(css).toContain('animation-duration: 1s;');
  });

  it('reads ViewTransition through a React namespace', async () => {
    const { css, names } = await compile(`import * as css from '@plumeria/core';
import * as React from 'react';
import { slide } from './definitions';
export const A = () => <React.ViewTransition share={slide}><div /></React.ViewTransition>;
`);
    expect(css).toContain(`::view-transition-old(*.${names[0]})`);
  });

  it('emits a class used in css.create', async () => {
    const { css, names } = await compile(`import * as css from '@plumeria/core';
import { slide } from './definitions';
const s = css.create({ card: { viewTransitionClass: slide } });
export const A = () => <div classStyle={s.card} />;
`);
    expect(css).toContain(`::view-transition-old(*.${names[0]})`);
  });

  it('leaves out a class that is only read elsewhere', async () => {
    const { code, css, names } =
      await compile(`import * as css from '@plumeria/core';
import { ViewTransition } from 'react';
import { slide } from './definitions';
const Other = (p: any) => p.children;
console.log(slide);
export const A = () => <Other default={slide}><ViewTransition name={slide} /></Other>;
`);
    expect(code).toContain(`console.log("${names[0]}")`);
    expect(css).not.toContain('view-transition');
  });

  it('leaves out a class whose name is shadowed by a local one', async () => {
    const { css } = await compile(`import * as css from '@plumeria/core';
import { ViewTransition } from 'react';
import { slide } from './definitions';
export const A = ({ slide }: any) => <ViewTransition default={slide}><div /></ViewTransition>;
`);
    expect(css).not.toContain('view-transition');
  });
});
