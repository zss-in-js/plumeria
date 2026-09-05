// Destructuring may rename the prop it binds. `{ styleArray: s }` is the same
// prop as `{ styleArray }`, so a component that applies `s` to its element must
// compile to the same lookup as one that applies `styleArray` directly. The
// prop table is keyed by the JSX attribute name the parent wrote, and the
// binding name is what the element reads, so the two have to be tied together.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const STYLES = path.join(DIR, 'styles.ts');
const RENAMED_APPLY = path.join(DIR, 'RenamedApply.tsx');
const DIRECT_APPLY = path.join(DIR, 'DirectApply.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { unpluginFactory } from '../src/core';
import { getStyleRecords } from '@plumeria/utils';

const RED = { padding: 4, color: 'red' };
const BLUE = { padding: 8, color: 'blue' };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create(${JSON.stringify({ red: RED, blue: BLUE })});
`,
  [RENAMED_APPLY]: `
import * as css from '@plumeria/core';
export const RenamedApply = ({ styleArray: s }: { styleArray?: css.Style }) => (
  <div classStyle={s} />
);
`,
  [DIRECT_APPLY]: `
import * as css from '@plumeria/core';
export const DirectApply = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { RenamedApply } from './RenamedApply';
import { DirectApply } from './DirectApply';

export const Parent = () => (
  <div>
    <RenamedApply styleArray={styles.red} />
    <DirectApply styleArray={styles.red} />
  </div>
);
`,
};

const run = async (file: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    files[file],
    file,
  );
  return result.code;
};

const classesOf = (style: Record<string, unknown>) =>
  getStyleRecords(style as never)
    .map((r) => r.hash)
    .sort()
    .join(' ');

const norm = (value: string) => value.trim().split(/\s+/).sort().join(' ');

const classExprOf = (code: string) =>
  code.match(/className=\{([\s\S]*?)\}(?= \/>)/)![1];

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('unplugin: a style prop renamed by destructuring', () => {
  // The renamed binding is still the prop the parent passed, so it resolves
  // like any other -- and the "never applied" check must not fire either.
  it('compiles the component that applies it', async () => {
    await run(PARENT);
    await expect(run(RENAMED_APPLY)).resolves.toEqual(expect.any(String));
  });

  it('resolves to the style the parent passed', async () => {
    await run(PARENT);
    const code = await run(RENAMED_APPLY);
    const table: Record<string, string> = JSON.parse(
      code.match(/\{("\w+":"[\w ]+",?)+\}/)![0],
    );
    expect(Object.values(table).map(norm)).toEqual([classesOf(RED)]);
  });

  it('matches the output of the same component without the rename', async () => {
    await run(PARENT);
    const renamed = classExprOf(await run(RENAMED_APPLY));
    const direct = classExprOf(await run(DIRECT_APPLY));
    expect(renamed.replace(/\bs\b/g, 'styleArray')).toEqual(direct);
  });
});
