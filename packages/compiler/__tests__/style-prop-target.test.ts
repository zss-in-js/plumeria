// A component the build never scans takes the style prop the way an element
// does, so a received style can be composed onto it. A component that declares
// the style prop would receive it a second time, which is a relay, even when
// the same style is also applied to an element.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );
  const at = (name: string) => path.join(DIR, name);

  const files: Record<string, string> = {
    'Header.tsx': `
import * as css from '@plumeria/core';
export const Header = ({ classStyle }: { classStyle?: css.Style }) => (
  <header classStyle={classStyle} />
);
`,
    'Wrapped.tsx': `
import * as css from '@plumeria/core';
import { Overlay } from 'dialog-lib';
const styles = css.create({ base: { position: 'fixed' } });
export const Wrapped = ({ classStyle }: { classStyle?: css.Style }) => (
  <Overlay classStyle={[styles.base, classStyle]} />
);
`,
    'Paired.tsx': `
import * as css from '@plumeria/core';
import { Overlay } from 'dialog-lib';
export const Paired = ({
  rootStyle,
  classStyle,
}: {
  rootStyle?: css.Style;
  classStyle?: css.Style;
}) => <Overlay classStyle={[rootStyle, classStyle]} />;
`,
    'Relay.tsx': `
import * as css from '@plumeria/core';
import { Header } from './Header';
export const Relay = ({ classStyle }: { classStyle?: css.Style }) => (
  <Header classStyle={classStyle} />
);
`,
    'RelayArray.tsx': `
import * as css from '@plumeria/core';
import { Header } from './Header';
const styles = css.create({ base: { position: 'fixed' } });
export const RelayArray = ({ classStyle }: { classStyle?: css.Style }) => (
  <Header classStyle={[styles.base, classStyle]} />
);
`,
    'Also.tsx': `
import * as css from '@plumeria/core';
import { Header } from './Header';
export const Also = ({ classStyle }: { classStyle?: css.Style }) => (
  <div classStyle={classStyle}>
    <Header classStyle={classStyle} />
  </div>
);
`,
    'App.tsx': `
import * as css from '@plumeria/core';
import { Wrapped } from './Wrapped';
import { Paired } from './Paired';
import { Relay } from './Relay';
import { RelayArray } from './RelayArray';
import { Also } from './Also';
const styles = css.create({ a: { color: 'teal' }, b: { color: 'navy' } });
export const App = () => (
  <>
    <Wrapped classStyle={styles.a} />
    <Paired rootStyle={styles.a} classStyle={styles.b} />
    <Relay classStyle={styles.a} />
    <RelayArray classStyle={styles.a} />
    <Also classStyle={styles.a} />
  </>
);
`,
  };

  beforeAll(() => {
    for (const [name, source] of Object.entries(files)) {
      fs.writeFileSync(at(name), source);
    }
  });
  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  const run = async (name: string) =>
    (
      await transformSource({
        source: files[name],
        moduleId: at(name),
        filePath: at(name),
        root: DIR,
        cwd: DIR,
        styleProp: DEFAULT_STYLE_PROP,
        propertyPolicy: undefined,
        isDev: false,
        addDependency: () => {},
      })
    ).code;

  it('composes a received style onto a dependency component', async () => {
    const code = await run('Wrapped.tsx');
    expect(code).toMatch(/<Overlay className=/);
    expect(code).not.toContain('classStyle=');
  });

  it('composes two received styles onto a dependency component', async () => {
    const code = await run('Paired.tsx');
    expect(code).toMatch(/<Overlay className=/);
    expect(code).not.toContain('classStyle=');
  });

  it.each(['Relay.tsx', 'RelayArray.tsx', 'Also.tsx'])(
    'rejects a received style passed to a component that declares it in %s',
    async (name) => {
      await expect(run(name)).rejects.toThrow(
        'passed on to a component that declares',
      );
    },
  );
});
