import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import vite from '../src/vite';

const directory = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-class-prop-detection-')),
);

const SOURCE = `import * as css from '@plumeria/core';
const styles = css.create({ a: { color: 'red' } });
export const A = () => <div classStyle={styles.a} />;
`;

type Adapted = {
  configResolved: (config: never) => void;
  transform: {
    handler: (
      this: unknown,
      code: string,
      id: string,
    ) => Promise<{ code: string } | null>;
  };
};

let counter = 0;

const resolved = (names: string[]) =>
  ({
    root: directory,
    command: 'build',
    plugins: names.map((name) => ({ name })),
  }) as never;

const run = async (names: string[]) => {
  const plugin = vite() as unknown as Adapted;
  plugin.configResolved(resolved(names));

  const filePath = path.join(directory, `case-${counter++}.tsx`);
  fs.writeFileSync(filePath, SOURCE);
  const result = await plugin.transform.handler.call(
    { addWatchFile() {} },
    SOURCE,
    filePath,
  );
  return result?.code ?? '';
};

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

it('writes the class attribute when a solid plugin is in the resolved config', async () => {
  const code = await run(['solid', '@plumeria/unplugin:vite']);

  expect(code).toContain('class={');
  expect(code).not.toContain('className={');
});

it('keeps className when no solid plugin is present', async () => {
  const code = await run(['vite:react-babel', '@plumeria/unplugin:vite']);

  expect(code).toContain('className={');
});

it('keeps className when the resolved config carries no plugin list', async () => {
  const plugin = vite() as unknown as Adapted;
  plugin.configResolved({ root: directory, command: 'build' } as never);

  const filePath = path.join(directory, `case-${counter++}.tsx`);
  fs.writeFileSync(filePath, SOURCE);
  const result = await plugin.transform.handler.call(
    { addWatchFile() {} },
    SOURCE,
    filePath,
  );

  expect(result?.code).toContain('className={');
});
