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
  describe('relative imports', () => {
    it('should resolve local sibling file', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'app/utils.ts': SOURCE });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('./utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'app/utils.ts'),
      );
    });

    it('should resolve local sibling file with extension', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'app/utils.ts': SOURCE });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('./utils.ts', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'app/utils.ts'));
    });

    it('should resolve index file', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'app/components/index.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('./components', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'app/components/index.ts'));
    });

    it('should return null if file not found', () => {
      const dir = project({ 'app/page.ts': SOURCE });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('./nonexistent', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });
  });

  describe('specifiers written for NodeNext', () => {
    it.each([
      ['./styles.js', 'app/styles.ts'],
      ['./styles.js', 'app/styles.tsx'],
      ['./styles.jsx', 'app/styles.tsx'],
    ])('should read %s as %s', (specifier, file) => {
      const dir = project({ 'app/page.ts': SOURCE, [file]: SOURCE });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath(specifier, path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, file),
      );
    });

    it('should prefer the file written on disk over the rewrite', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'app/styles.js': SOURCE,
        'app/styles.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('./styles.js', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'app/styles.js'));
    });

    it('should leave a specifier that answers no rewrite alone', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'app/styles.tsx': SOURCE });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('./styles.mjs', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('should read an aliased specifier as its source file', () => {
      const dir = project({
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./src/*'] } },
        }),
        'app/page.ts': SOURCE,
        'src/styles.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/styles.js', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'src/styles.ts'));
    });
  });

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

  describe('tsconfig paths', () => {
    it('should resolve aliased path', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    it('should resolve fallback if multiple paths', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: { '@ui/*': ['./libs/ui/src/*', './libs/common/ui/*'] },
          },
        }),
        'libs/common/ui/button.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@ui/button', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'libs/common/ui/button.ts'));
    });

    it('should handle tsconfig without paths', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('should handle tsconfig without compilerOptions', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': '{}',
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('should handle invalid tsconfig', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': 'not json at all',
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('should skip non-matching aliases and handle failing targets', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: {
              '@non-match/*': ['./ignore/*'],
              '@match/*': ['./missing/*', './lib/*'],
            },
          },
        }),
        'lib/found.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@match/found', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'lib/found.ts'));
    });

    // A tsconfig is JSONC to every tool that reads it, and the shapes below all
    // compile: reading them as strict JSON dropped the alias without a word,
    // and the style behind it left the sheet.
    it('reads a config written with line and block comments', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': `{
  // where the sources live
  "compilerOptions": {
    /* the only alias */
    "paths": { "@/*": ["./lib/*"] }
  }
}`,
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    it('reads a config written with a trailing comma', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': `{
  "compilerOptions": {
    "paths": { "@/*": ["./lib/*"] },
  },
}`,
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    it('reads a config saved with a byte order mark', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json':
          '﻿' +
          JSON.stringify({
            compilerOptions: { paths: { '@/*': ['./lib/*'] } },
          }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    // `paths` is replaced wholesale by the config that writes it, so an empty
    // one is a config saying it has no aliases — not one asking for the base's.
    it('lets an empty paths object cancel an inherited one', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'tsconfig.json': JSON.stringify({
          extends: './base.json',
          compilerOptions: { paths: {} },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    it('reads paths inherited through extends', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'tsconfig.json': JSON.stringify({ extends: './tsconfig.base.json' }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    // The wildcard stands for a path segment, so a `..` written after it walks
    // out of whatever the specifier put there. Normalizing the substitution
    // before filling the wildcard in cancelled a segment that was not there
    // yet, and the import landed on a file nobody asked for.
    it('fills the wildcard in before the substitution is normalized', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./src/*/../shared'] } },
        }),
        'src/a/shared.ts': SOURCE,
        'src/shared.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/a/b', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'src/a/shared.ts'),
      );
    });

    it('extends a package that names its config in package.json', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
          tsconfig: 'base.json',
        }),
        'node_modules/config-pkg/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/lib/utils.ts'),
      );
    });

    // `main` names the package's runtime entry, and tsc does not read it for a
    // config even when it happens to be JSON. Taking it meant a package whose
    // entry is data inherited the wrong table, or none at all.
    it('prefers the named config over a package entry that is JSON', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
          main: 'other.json',
          tsconfig: 'base.json',
        }),
        'node_modules/config-pkg/other.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./wrong/*'] } },
        }),
        'node_modules/config-pkg/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/wrong/utils.ts': SOURCE,
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/lib/utils.ts'),
      );
    });

    it('falls back to the package tsconfig over an entry that is JSON', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
          main: 'other.json',
        }),
        'node_modules/config-pkg/other.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./wrong/*'] } },
        }),
        'node_modules/config-pkg/tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/wrong/utils.ts': SOURCE,
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/lib/utils.ts'),
      );
    });

    it('lets exports answer ahead of the named config', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
          exports: { '.': './exported.json' },
          tsconfig: 'base.json',
        }),
        'node_modules/config-pkg/exported.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./exported/*'] } },
        }),
        'node_modules/config-pkg/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/exported/utils.ts': SOURCE,
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/exported/utils.ts'),
      );
    });

    it('extends a config named by a subpath of a package', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
        }),
        'node_modules/config-pkg/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg/base.json' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/lib/utils.ts'),
      );
    });

    // Resolving the specifier lands on the package's JS entry, which is not a
    // config and never will be. The config sits beside it.
    it('extends a package whose entry point is not its config', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'node_modules/config-pkg/package.json': JSON.stringify({
          name: 'config-pkg',
          version: '1.0.0',
          main: 'index.js',
        }),
        'node_modules/config-pkg/index.js': 'module.exports = {};\n',
        'node_modules/config-pkg/tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'node_modules/config-pkg/lib/utils.ts': SOURCE,
        'tsconfig.json': JSON.stringify({ extends: 'config-pkg' }),
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'node_modules/config-pkg/lib/utils.ts'),
      );
    });

    // A shared base config cannot point at the project that uses it with a
    // relative path, so it writes ${configDir} instead: the directory of the
    // config doing the extending, not the one holding the substitution.
    it('expands ${configDir} to the config that extends the base', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'config/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['${configDir}/src/*'] } },
        }),
        'tsconfig.json': JSON.stringify({ extends: './config/base.json' }),
        'src/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'src/utils.ts'),
      );
    });

    it('anchors an inherited substitution to the config that declares it', () => {
      // tsc reads `./source/*` against the file it is written in, not against
      // the config that inherits it, so a base config one directory down points
      // one directory down.
      const dir = project({
        'app/page.ts': SOURCE,
        'config/base.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./source/*'] } },
        }),
        'tsconfig.json': JSON.stringify({ extends: './config/base.json' }),
        'config/source/utils.ts': SOURCE,
        'source/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'config/source/utils.ts'),
      );
    });

    it('takes the last entry of an extends list', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'first.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./first/*'] } },
        }),
        'second.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./second/*'] } },
        }),
        'tsconfig.json': JSON.stringify({
          extends: ['./first.json', './second.json'],
        }),
        'first/utils.ts': SOURCE,
        'second/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'second/utils.ts'),
      );
    });

    // tsc matches the longest prefix, not the first one written. Reading them
    // in source order handed back a candidate under the shorter alias, and a
    // file that happened to sit there was compiled in place of the real one.
    it('matches the longest prefix rather than the first written', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: { '@/*': ['./a/*'], '@/lib/*': ['./b/*'] },
          },
        }),
        'a/lib/utils.ts': SOURCE,
        'b/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/lib/utils', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'b/utils.ts'));
    });

    it('answers an alias written without a wildcard exactly', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            paths: { '@/*': ['./a/*'], '@styles': ['./b/styles.ts'] },
          },
        }),
        'a/styles.ts': SOURCE,
        'b/styles.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@styles', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'b/styles.ts'),
      );
    });

    // baseUrl is deprecated in TypeScript 6 and stops functioning in 7, and a
    // substitution written against one has never resolved here. Nothing reads
    // it, so such a config keeps resolving to nothing rather than to a path
    // that was never asked for.
    it('does not read a substitution written against baseUrl', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { baseUrl: './lib', paths: { '@/*': ['*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    // The config a Vite project is scaffolded with holds no compilerOptions of
    // its own: it lists the configs that do. Reading only the root one found no
    // paths at all and left every alias in the project unresolved.
    it('reads paths from a referenced config', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          files: [],
          references: [{ path: './tsconfig.app.json' }],
        }),
        'tsconfig.app.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    it('reads paths from a config referenced by its directory', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          files: [],
          references: [{ path: './packages/app' }],
        }),
        'packages/app/tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'packages/app/lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'packages/app/lib/utils.ts'),
      );
    });

    // References are a list of projects, and one matcher answers the whole
    // scan, so the first list entry that declares any is the one it answers
    // with. An entry declaring none is passed over rather than ending the walk.
    it('passes over a referenced config that declares no paths', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          files: [],
          references: [{ path: './packages/a' }, { path: './packages/b' }],
        }),
        'packages/a/tsconfig.json': JSON.stringify({
          compilerOptions: { strict: true },
        }),
        'packages/b/tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'packages/b/lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'packages/b/lib/utils.ts'),
      );
    });

    it('answers a cycle of references instead of walking it', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          files: [],
          references: [{ path: './tsconfig.app.json' }],
        }),
        'tsconfig.app.json': JSON.stringify({
          references: [{ path: './tsconfig.json' }],
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('@/utils', path.join(dir, 'app/page.ts')),
      ).toBeNull();
    });

    // tsc rejects a substitution that is neither relative nor under a baseUrl,
    // but the resolver read one for as long as it had its own matcher. A
    // project that compiles its styles without ever running tsc keeps it.
    it('still resolves a substitution tsc would reject', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['lib/*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });
  });

  describe('package resolution (fallback)', () => {
    it('should resolve relative to package root if no tsconfig paths match', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'package.json': '{}',
        'types/common.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath('types/common', path.join(dir, 'app/page.ts')),
      ).toBe(path.join(dir, 'types/common.ts'));
    });
  });

  describe('caching', () => {
    it('should reuse cached tsconfig result', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);
      const importer = path.join(dir, 'app/page.ts');

      expect(resolveImportPath('@/utils', importer)).toBe(
        path.join(dir, 'lib/utils.ts'),
      );

      fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}', 'utf8');

      expect(resolveImportPath('@/utils', importer)).toBe(
        path.join(dir, 'lib/utils.ts'),
      );
    });

    it('should reuse cached null result (no tsconfig)', () => {
      const dir = project({ 'app/page.ts': SOURCE, 'lib/utils.ts': SOURCE });
      const { resolveImportPath } = load(dir);
      const importer = path.join(dir, 'app/page.ts');

      expect(resolveImportPath('@/utils', importer)).toBeNull();

      fs.writeFileSync(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'utf8',
      );

      expect(resolveImportPath('@/utils', importer)).toBeNull();
    });

    it('should hit tsConfigCache when same config is used by different startDir', () => {
      const dir = project({
        'app/page.ts': SOURCE,
        'other/index.ts': SOURCE,
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./lib/*'] } },
        }),
        'lib/utils.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);
      const target = path.join(dir, 'lib/utils.ts');

      expect(resolveImportPath('@/utils', path.join(dir, 'app/page.ts'))).toBe(
        target,
      );
      expect(
        resolveImportPath('@/utils', path.join(dir, 'other/index.ts')),
      ).toBe(target);
    });
  });

  describe('the core package specifier', () => {
    it('is answered without touching the fs, in any environment', () => {
      // Every compiled file imports it and it can never be a local module, so
      // resolving it would only ever walk the tree and stat paths that cannot
      // exist. Callers rely on the null, not on the walk.
      const dir = project({ 'app/page.ts': SOURCE });
      const { resolveImportPath } = load(dir);
      const statSync = jest.spyOn(fs, 'statSync');
      const existsSync = jest.spyOn(fs, 'existsSync');

      expect(
        resolveImportPath('@plumeria/core', path.join(dir, 'app/page.ts')),
      ).toBeNull();
      expect(statSync).not.toHaveBeenCalled();
      expect(existsSync).not.toHaveBeenCalled();
    });

    it('still resolves a specifier that merely starts with the same prefix', () => {
      // The gate is an exact match, so a longer specifier must take the normal
      // bare-specifier path: walk up to the nearest package.json, resolve from
      // there.
      const dir = project({
        'app/page.ts': SOURCE,
        'package.json': '{}',
        '@plumeria/core-extras.ts': SOURCE,
      });
      const { resolveImportPath } = load(dir);

      expect(
        resolveImportPath(
          '@plumeria/core-extras',
          path.join(dir, 'app/page.ts'),
        ),
      ).toBe(path.join(dir, '@plumeria/core-extras.ts'));
    });
  });
});
