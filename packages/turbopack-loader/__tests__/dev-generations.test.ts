import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import cssLoader from '../src/css';
import { devGenerationsPath } from '../src/index';

const projectDir = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-dev-generations-')),
);
const FILE = path.join(projectDir, 'box.tsx');

const moduleUsing = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div classStyle={styles.box} />;
`;

const compileWith = (color: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fs.writeFileSync(FILE, moduleUsing(color));
    cssLoader.call({
      async: () => (err: Error | null, css?: string) =>
        err ? reject(err) : resolve(css as string),
      addDependency: () => {},
    });
  });

describe('the virtual CSS in development', () => {
  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    jest.spyOn(process, 'cwd').mockReturnValue(projectDir);
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  });

  afterEach(() => {
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    jest.restoreAllMocks();
  });

  it('keeps the rules of the previous edit for modules not yet updated', async () => {
    await compileWith('#a11111');
    const css = await compileWith('#1111a1');

    expect(css).toContain('#a11111');
    expect(css).toContain('#1111a1');
  });

  it('drops a rule two edits old', async () => {
    await compileWith('#a11111');
    await compileWith('#1111a1');
    const css = await compileWith('#11a111');

    expect(css).not.toContain('#a11111');
    expect(css).toContain('#1111a1');
    expect(css).toContain('#11a111');
  });

  it('does not advance when the same stylesheet is compiled again', async () => {
    await compileWith('#a11111');
    await compileWith('#1111a1');
    await compileWith('#1111a1');
    const css = await compileWith('#1111a1');

    expect(css).toContain('#a11111');
  });

  it('serves only the current rules outside development', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    await compileWith('#a11111');
    const css = await compileWith('#1111a1');

    expect(css).not.toContain('#a11111');
  });
});
