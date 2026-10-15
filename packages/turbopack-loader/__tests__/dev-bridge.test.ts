import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { optimizer } from '@plumeria/compiler';
import loader, { DEV_BRIDGE_WINDOW_MS, devGenerationsPath } from '../src/index';
import cssLoader from '../src/css';
import type { LoaderOptions } from '../src/index';

/**
 * A module edited in development carries the stylesheet of that moment, so the
 * browser can apply the new rules before the stylesheet itself arrives. The
 * carried stylesheet must hold the same rules in the same order as the
 * production build, whatever the rendering boundary or file the rules come from.
 */

const pre = `import * as css from '@plumeria/core';`;

let projectDir: string;
let previousCwd: string;

const write = (files: Record<string, string>) => {
  for (const [file, source] of Object.entries(files)) {
    fs.writeFileSync(path.join(projectDir, file), source);
  }
};

const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

const withEnv = <T>(env: string, run: () => T): T => {
  const previous = process.env.NODE_ENV;
  setNodeEnv(env);
  try {
    return run();
  } finally {
    setNodeEnv(previous);
  }
};

const transform = (
  file: string,
  options: LoaderOptions = {},
  source = fs.readFileSync(path.join(projectDir, file), 'utf-8'),
) =>
  new Promise<string>((resolve, reject) => {
    const resourcePath = path.join(projectDir, file);
    loader
      .call(
        {
          resourcePath,
          context: projectDir,
          rootContext: projectDir,
          getOptions: () => options,
          async: () => (err, out) => (err ? reject(err) : resolve(out!)),
          addDependency: () => {},
          clearDependencies: () => {},
        },
        source,
      )
      .catch(reject);
  });

const edited = async (file: string, options: LoaderOptions = {}) => {
  const source = fs.readFileSync(path.join(projectDir, file), 'utf-8');
  await transform(file, options, `${source}\nexport const before = 0;\n`);
  return transform(file, options);
};

const stylesheet = (options: LoaderOptions = {}) =>
  new Promise<string>((resolve, reject) => {
    cssLoader.call({
      getOptions: () => options,
      async: () => (err: Error | null, css?: string) =>
        err ? reject(err) : resolve(css as string),
      addDependency: () => {},
    });
  });

const production = async (options: LoaderOptions = {}) => {
  const previous = process.env.NODE_ENV;
  setNodeEnv('production');
  try {
    return await stylesheet(options);
  } finally {
    setNodeEnv(previous);
  }
};

const minify = (css: string) => withEnv('production', () => optimizer(css));

const bridgeOf = (output: string) => {
  const match = output.match(
    /\)\(("(?:[^"\\]|\\.)*"), ("[0-9a-f]{16}"), "plumeria-dev-bridge"\);\n$/,
  );
  return match
    ? {
        css: JSON.parse(match[1]) as string,
        id: JSON.parse(match[2]) as string,
      }
    : null;
};

const expectProductionParity = async (
  file: string,
  options: LoaderOptions = {},
) => {
  const bridge = bridgeOf(await edited(file, options));
  expect(bridge).not.toBeNull();
  expect(minify(bridge!.css)).toBe(await production(options));
  return bridge!.css;
};

describe('the stylesheet an edited module carries in development', () => {
  beforeEach(() => {
    projectDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-dev-bridge-')),
    );
    previousCwd = process.cwd();
    process.chdir(projectDir);
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('matches the production stylesheet for an edited client component', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#1a2b3c', padding: 8 } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    const css = await expectProductionParity('Client.tsx');

    expect(css).toContain('#1a2b3c');
  });

  it('covers the server component that renders the edited client component', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#1a2b3c' } });
export const Client = () => <div classStyle={styles.box} />;
`,
      'Page.tsx': `${pre}
import { Client } from './Client';
const page = css.create({ main: { backgroundColor: '#5a5a5a' } });
export default function Page() {
  return <main classStyle={page.main}><Client /></main>;
}
`,
    });

    const css = await expectProductionParity('Client.tsx');

    expect(css).toContain('#5a5a5a');
  });

  it('covers server children passed into the edited client component', async () => {
    write({
      'Shell.tsx': `'use client';
${pre}
const styles = css.create({ shell: { borderColor: '#2c3d4e' } });
export const Shell = ({ children }: { children: React.ReactNode }) => (
  <section classStyle={styles.shell}>{children}</section>
);
`,
      'Page.tsx': `${pre}
import { Shell } from './Shell';
const page = css.create({ text: { color: '#6b6b6b' } });
export default function Page() {
  return <Shell><p classStyle={page.text}>server</p></Shell>;
}
`,
    });

    const css = await expectProductionParity('Shell.tsx');

    expect(css).toContain('#6b6b6b');
  });

  it('keeps a media rule from another file after the edited base rule', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
import { wide } from './wide.styles';
const styles = css.create({ box: { color: '#3e4f5a' } });
export const Client = () => <div classStyle={[styles.box, wide.box]} />;
`,
      'wide.styles.ts': `${pre}
export const wide = css.create({
  box: { '@media (min-width: 600px)': { color: '#7c7c7c' } },
});
`,
    });

    const css = await expectProductionParity('Client.tsx');

    expect(css.indexOf('#3e4f5a')).toBeLessThan(css.indexOf('@media'));
  });

  it('orders breakpoints defined in different files as production does', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
import { medium } from './medium.styles';
import { large } from './large.styles';
const styles = css.create({ box: { '@media (min-width: 900px)': { padding: 24 } } });
export const Client = () => <div classStyle={[large.box, styles.box, medium.box]} />;
`,
      'medium.styles.ts': `${pre}
export const medium = css.create({
  box: { '@media (min-width: 600px)': { padding: 16 } },
});
`,
      'large.styles.ts': `${pre}
export const large = css.create({
  box: { '@media (min-width: 1200px)': { padding: 32 } },
});
`,
    });

    await expectProductionParity('Client.tsx');
  });

  it('matches production when a shared style module is the edited file', async () => {
    write({
      'shared.styles.ts': `${pre}
export const shared = css.create({ box: { color: '#4f5a6b', ':hover': { color: '#8d8d8d' } } });
`,
      'Client.tsx': `'use client';
${pre}
import { shared } from './shared.styles';
export const Client = () => <div classStyle={shared.box} />;
`,
    });

    const css = await expectProductionParity('shared.styles.ts');

    expect(css).toContain('#8d8d8d');
  });

  it('carries the theme and keyframes defined in other files', async () => {
    write({
      'theme.ts': `${pre}
export const theme = css.createTheme('.dark', {
  accent: { default: '#5a6b7c', theme: '#c7b6a5' },
});
`,
      'motion.ts': `${pre}
export const fadeIn = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
`,
      'Client.tsx': `'use client';
${pre}
import { theme } from './theme';
import { fadeIn } from './motion';
const styles = css.create({
  box: { color: theme.accent, animationName: fadeIn, animationDuration: '1s' },
});
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    const css = await expectProductionParity('Client.tsx');

    const variable = css.match(/var\((--\w+-accent)\)/);

    expect(variable).not.toBeNull();
    expect(css).toMatch(
      new RegExp(`:where\\(:root\\) \\{\\s*${variable![1]}: #5a6b7c;`),
    );
    expect(css).toMatch(new RegExp(`\\.dark \\{\\s*${variable![1]}: #c7b6a5;`));
    expect(css).toContain('@keyframes');
  });

  it('carries keyframes from a client style module that a server style module uses', async () => {
    write({
      'motion.styles.ts': `'use client';
${pre}
export const fadeIn = css.keyframes({ from: { opacity: 0 }, to: { opacity: 0.5 } });
`,
      'card.styles.ts': `${pre}
import { fadeIn } from './motion.styles';
export const card = css.create({ box: { animationName: fadeIn, animationDuration: '2s' } });
`,
      'Page.tsx': `${pre}
import { card } from './card.styles';
export default function Page() {
  return <div classStyle={card.box} />;
}
`,
    });

    const css = await expectProductionParity('motion.styles.ts');
    const keyframes = css.match(/@keyframes (kf-\w+)/);

    expect(keyframes).not.toBeNull();
    expect(css).toContain(`animation-name: ${keyframes![1]}`);
  });

  it('resolves styles composed on one element the same way as production', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const first = css.create({ box: { color: '#6b7c8d', margin: 4 } });
const second = css.create({ box: { color: '#9e9e9e', marginTop: 8 } });
export const Client = ({ on }: { on: boolean }) => (
  <div classStyle={[first.box, on && second.box]} />
);
`,
    });

    await expectProductionParity('Client.tsx');
  });

  it('builds with the same options as the stylesheet loader', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { marginLeft: 12, paddingTop: 4 } });
export const Client = () => <div sx={styles.box} />;
`,
    });
    const options: LoaderOptions = {
      styleProp: 'sx',
      withoutLogicalProperties: true,
    };

    await expectProductionParity('Client.tsx', options);
  });

  it('marks the dev stylesheet with the generation the module carries', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#7d8e9f' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    const bridge = bridgeOf(await edited('Client.tsx'));

    expect(await stylesheet()).toContain(
      `[data-plumeria-generation="${bridge!.id}"]`,
    );
    expect(bridge!.css).not.toContain('data-plumeria-generation');
  });

  it('leaves out modules not edited within the window', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#8e9faa' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });
    const before = (Date.now() - DEV_BRIDGE_WINDOW_MS - 1000) / 1000;
    fs.utimesSync(path.join(projectDir, 'Client.tsx'), before, before);

    expect(bridgeOf(await edited('Client.tsx'))).toBeNull();
  });

  it('carries the stylesheet in a module whose style module was just edited', async () => {
    const styleModule = (color: string) => `${pre}
export const styles = css.create({ box: { backgroundColor: '${color}' } });
`;
    write({
      'tst.ts': styleModule('#8e9dac'),
      'Client.tsx': `'use client';
import { styles } from './tst';
export const Client = () => <div classStyle={styles.box} />;
`,
    });
    const before = (Date.now() - DEV_BRIDGE_WINDOW_MS - 1000) / 1000;
    fs.utimesSync(path.join(projectDir, 'Client.tsx'), before, before);
    await transform('Client.tsx');

    write({ 'tst.ts': styleModule('#9eafba') });
    const bridge = bridgeOf(await transform('Client.tsx'));

    expect(bridge).not.toBeNull();
    expect(minify(bridge!.css)).toBe(await production());
    expect(bridge!.css).toContain('#9eafba');
  });

  it('leaves out a module whose style modules were not edited within the window either', async () => {
    write({
      'tst.ts': `${pre}
export const styles = css.create({ box: { backgroundColor: '#afbacb' } });
`,
      'Client.tsx': `'use client';
import { styles } from './tst';
export const Client = () => <div classStyle={styles.box} />;
`,
    });
    const before = (Date.now() - DEV_BRIDGE_WINDOW_MS - 1000) / 1000;
    fs.utimesSync(path.join(projectDir, 'Client.tsx'), before, before);
    fs.utimesSync(path.join(projectDir, 'tst.ts'), before, before);

    expect(bridgeOf(await edited('Client.tsx'))).toBeNull();
  });

  it('leaves out the first transform of a module, however recently it was saved', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#9daebf' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    expect(bridgeOf(await transform('Client.tsx'))).toBeNull();
  });

  it('leaves out a repeated transform with the same output, as the server and the client compile the same module', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#adbecf' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    await transform('Client.tsx');

    expect(bridgeOf(await transform('Client.tsx'))).toBeNull();
  });

  it('carries the stylesheet in every compile of an edit, as the server and the client both compile the edited module', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#bdcedf' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });

    const server = bridgeOf(await edited('Client.tsx'));
    const client = bridgeOf(await transform('Client.tsx'));

    expect(server).not.toBeNull();
    expect(client).toEqual(server);
  });

  it('never carries a stylesheet in a production build', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#9faabb' } });
export const Client = () => <div classStyle={styles.box} />;
`,
    });
    setNodeEnv('production');

    const output = await transform('Client.tsx');

    expect(bridgeOf(output)).toBeNull();
    expect(output).not.toContain('plumeria-dev-bridge');
  });

  it('still transforms the module when another file breaks the stylesheet', async () => {
    write({
      'Client.tsx': `'use client';
${pre}
const styles = css.create({ box: { color: '#aabbcc' } });
export const Client = () => <div classStyle={styles.box} />;
`,
      'broken.ts': `${pre}
export const theme = css.createTheme('@nonsense', { color: { default: 'red', theme: 'blue' } });
`,
    });

    const output = await edited('Client.tsx');

    expect(output).toContain('className');
    expect(bridgeOf(output)).toBeNull();
  });
});
