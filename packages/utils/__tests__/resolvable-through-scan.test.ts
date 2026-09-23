import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-scan-'));

const animation = path.join(dir, 'animation.ts');
fs.writeFileSync(
  animation,
  `import * as css from '@plumeria/core';\nexport const spin = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });\n`,
);

const local = path.join(dir, 'local.tsx');
const localSource = `import * as css from '@plumeria/core';
const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const swap = css.viewTransition({ old: { opacity: 0 } });
const styles = css.create({
  box: { animationName: fade, viewTransitionName: swap, animationDuration: '1s' },
});
`;
fs.writeFileSync(local, localSource);

const imported = path.join(dir, 'imported.tsx');
const importedSource = `import * as css from '@plumeria/core';
import { spin } from './animation';
const styles = css.create({ box: { animationName: spin, animationDuration: '1s' } });
`;
fs.writeFileSync(imported, importedSource);

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [animation, local, imported]),
}));

import { transformSource, scanAll } from '../src/index';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const compile = (filePath: string, source: string) =>
  transformSource({
    source,
    moduleId: filePath,
    filePath,
    root: dir,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

// The unresolvable-value check compares the keys a style object was given
// against the keys it resolved, and a name that only the scan can resolve is
// absent until the scan has run. These two shapes are the ones that check
// would reject first if it ever ran ahead of the tables being merged.
describe('a name the scan resolves is not treated as a dropped value', () => {
  beforeAll(() => {
    (scanAll as unknown as (cwd: string) => unknown)(dir);
  });

  it('accepts a keyframes and a viewTransition declared in the same file', async () => {
    await expect(compile(local, localSource)).resolves.toBeDefined();
  });

  it('accepts a keyframes imported from another file', async () => {
    await expect(compile(imported, importedSource)).resolves.toBeDefined();
  });
});
