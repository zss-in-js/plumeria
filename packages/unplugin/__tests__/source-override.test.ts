import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { unpluginFactory } from '../src/core';

const moduleUsing = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div classStyle={styles.box} />;
`;

const DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-unplugin-source-')),
);
const FILE = path.join(DIR, 'box.tsx');

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

it.each([true, false])(
  'serves the CSS of the source it compiled, not the file on disk (dev: %s)',
  async (isDev) => {
    fs.writeFileSync(FILE, moduleUsing('#a11111'));
    const plugin = unpluginFactory({ lint: false }, {
      framework: 'vite',
    } as never) as any;
    plugin.__plumeriaInternal.setDev(isDev);
    plugin.__plumeriaInternal.setRoot(DIR);

    const result = await plugin.transform.handler.call(
      { addWatchFile() {} },
      moduleUsing('#1111a1'),
      FILE,
    );
    const css: string =
      plugin.__plumeriaInternal.cssLookup.get(path.join(DIR, 'box.zero.css')) ??
      '';
    const [className] = result.code.match(/x[0-9a-z]{7}/) ?? [];

    expect(css).toContain('#1111a1');
    expect(css).not.toContain('#a11111');
    expect(css).toContain(`.${className}`);
  },
);
