import fs from 'node:fs';
import path from 'node:path';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn() }));
import * as rs from '@rust-gear/glob';

const mockedRs = rs as jest.Mocked<typeof rs>;

const tmpDir = path.join(__dirname, '__tmp_scan_order__');
const styleFile = path.join(tmpDir, 'panel.styles.ts');
const parentFile = path.join(tmpDir, 'Panel.tsx');

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(
    styleFile,
    `import * as css from '@plumeria/core';
export const panelStyles = css.create({ box: { color: 'red' } });
`,
  );
  fs.writeFileSync(
    parentFile,
    `import '@plumeria/core';
import { panelStyles } from './panel.styles';
import { Item } from './Item';
export const Panel = () => <Item styleName={panelStyles.box} />;
`,
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const scanWithOrder = (files: string[]) => {
  let entries: unknown[] = [];
  jest.isolateModules(() => {
    mockedRs.globSync.mockReturnValue(files);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { scanAll } = require('../src/parser');
    const table = scanAll().componentPropsTable || {};
    entries = Object.keys(table).flatMap((compKey) =>
      Object.keys(table[compKey]).flatMap((prop) => table[compKey][prop]),
    );
  });
  return entries;
};

describe('scanAll is independent of the order files are globbed in', () => {
  // The glob walks directories in parallel, so the order is not stable between
  // runs. A style prop passed to a child component must still be registered
  // when the file using the style is visited before the file defining it.
  it('registers the same prop entry in either order', () => {
    const definerFirst = scanWithOrder([styleFile, parentFile]);
    const userFirst = scanWithOrder([parentFile, styleFile]);

    expect(definerFirst).toHaveLength(1);
    expect(userFirst).toHaveLength(1);
    expect(userFirst).toEqual(definerFirst);
  });
});
