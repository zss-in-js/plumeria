import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import loader, { devGenerationsPath } from '../src/index';
import cssLoader from '../src/css';

const projectDir = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-dev-error-')),
);
const STYLES = path.join(projectDir, 'repro.styles.ts');
const PAGE = path.join(projectDir, 'page.tsx');

const stylesWith = (width: string) => `import * as css from '@plumeria/core';
export const repro = css.create({ article: { width: ${width} } });
`;
const PAGE_SOURCE = `import * as css from '@plumeria/core';
import { repro } from './repro.styles';
export const Page = () => <div classStyle={repro.article} />;
`;

type Result = {
  error: Error | null;
  output?: string;
  emitted: Error[];
  dependencies: string[];
};

const runJs = (): Promise<Result> =>
  new Promise((resolve) => {
    const emitted: Error[] = [];
    const dependencies: string[] = [];
    (
      loader as unknown as (this: unknown, source: string) => Promise<void>
    ).call(
      {
        resourcePath: PAGE,
        async: () => (error: Error | null, output?: string) =>
          resolve({ error, output, emitted, dependencies }),
        addDependency: (file: string) => dependencies.push(file),
        clearDependencies: () => {},
        emitError: (error: Error) => emitted.push(error),
      },
      PAGE_SOURCE,
    );
  });

const runCss = (): Promise<Result> =>
  new Promise((resolve) => {
    const emitted: Error[] = [];
    const dependencies: string[] = [];
    cssLoader.call({
      async: () => (error: Error | null, output?: string) =>
        resolve({ error, output, emitted, dependencies }),
      addDependency: (file: string) => dependencies.push(file),
      emitError: (error: Error) => emitted.push(error),
    });
  });

describe('a syntax error in an imported style file', () => {
  const previousCwd = process.cwd();

  beforeAll(() => {
    fs.writeFileSync(PAGE, PAGE_SOURCE);
    process.chdir(projectDir);
  });

  afterAll(() => {
    process.chdir(previousCwd);
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    fs.writeFileSync(STYLES, stylesWith(`'1000px'`));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('in development', () => {
    beforeEach(() => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'development');
    });

    it('reports the error and keeps watching the imported file from the page', async () => {
      fs.writeFileSync(STYLES, stylesWith(`1000px'`));

      const { error, output, emitted, dependencies } = await runJs();

      expect(error).toBeNull();
      expect(emitted).toHaveLength(1);
      expect(output).toContain('throw new Error(');
      expect(dependencies).toContain(STYLES);
    });

    it('recovers the page once the imported file is fixed', async () => {
      fs.writeFileSync(STYLES, stylesWith(`1000px'`));
      await runJs();
      fs.writeFileSync(STYLES, stylesWith(`'1200px'`));

      const { error, output, emitted } = await runJs();

      expect(error).toBeNull();
      expect(emitted).toEqual([]);
      expect(output).toContain('className=');
    });

    it('reports the error and keeps serving the last good stylesheet', async () => {
      const good = await runCss();
      fs.writeFileSync(STYLES, stylesWith(`1000px'`));

      const { error, output, emitted, dependencies } = await runCss();

      expect(good.output).toContain('1000px');
      expect(error).toBeNull();
      expect(emitted).toHaveLength(1);
      expect(output).toContain('1000px');
      expect(dependencies).toContain(STYLES);
    });
  });

  describe('in a production build', () => {
    beforeEach(() => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    });

    it('fails the page', async () => {
      fs.writeFileSync(STYLES, stylesWith(`1000px'`));

      const { error, emitted } = await runJs();

      expect(error?.message).toContain('Invalid characters');
      expect(emitted).toEqual([]);
    });

    it('fails the stylesheet', async () => {
      fs.writeFileSync(STYLES, stylesWith(`1000px'`));

      const { error, emitted } = await runCss();

      expect(error?.message).toContain('Invalid characters');
      expect(emitted).toEqual([]);
    });
  });
});
