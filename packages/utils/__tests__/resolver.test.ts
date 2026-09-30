import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// get-tsconfig reads the config through its own fs handles, so the config a
// test declares has to be a real file for the resolver to see it at all.
const ROOT = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-resolver-')),
);

let projectCount = 0;

const project = (files: Record<string, string>) => {
  const dir = path.join(ROOT, `project-${projectCount++}`);
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return dir;
};

const load = (cwd: string) => {
  jest.resetModules();
  jest.spyOn(process, 'cwd').mockReturnValue(cwd);
  return require('../src/resolver') as typeof import('../src/resolver');
};

const SOURCE = 'export const value = 1;\n';

afterEach(() => jest.restoreAllMocks());

afterAll(() => fs.rmSync(ROOT, { recursive: true, force: true }));

describe('resolver', () => {
  describe('resetImportResolutionCache', () => {
    it('loads paths relative to the requested config directory', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'config/tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./source/*'] } },
        }),
        'config/source/value.ts': SOURCE,
      });
      const { resolveImportPath, resetImportResolutionCache } = load(dir);

      resetImportResolutionCache(path.join(dir, 'config'));

      expect(resolveImportPath('@/value', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'config/source/value.ts'),
      );
    });

    it('reads no paths when the current directory holds no config', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'lib/utils.ts': SOURCE });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('uses the current directory by default', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./source/*'] } },
        }),
        'source/value.ts': SOURCE,
      });
      const { resolveImportPath, resetImportResolutionCache } = load(dir);

      resetImportResolutionCache();

      expect(resolveImportPath('@/value', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'source/value.ts'),
      );
    });

    it('caches a failed config read as no config', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'source/value.ts': SOURCE });
      const { resolveImportPath, resetImportResolutionCache } = load(dir);

      resetImportResolutionCache(dir);

      fs.writeFileSync(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./source/*'] } },
        }),
        'utf8',
      );

      expect(
        resolveImportPath('@/value', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });
  });
});
