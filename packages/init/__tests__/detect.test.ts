import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  defaultConfigName,
  detect,
  detectBundler,
  detectPackageManager,
} from '../src/detect';
import type { Manifest } from '../src/detect';

const add = (dir: string, name: string, content: string) => {
  const file = path.join(dir, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

const manifest = (fields: Manifest) => JSON.stringify(fields, null, 2);

describe('detect', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-init-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('package manager', () => {
    it('reads the packageManager field before a lockfile', () => {
      add(dir, 'package-lock.json', '{}');
      expect(detectPackageManager(dir, { packageManager: 'pnpm@11.3.0' })).toBe(
        'pnpm',
      );
    });

    it.each([
      ['pnpm-lock.yaml', 'pnpm'],
      ['bun.lock', 'bun'],
      ['yarn.lock', 'yarn'],
      ['package-lock.json', 'npm'],
    ])('reads %s as %s', (lockfile, expected) => {
      add(dir, lockfile, '');
      expect(detectPackageManager(dir, {})).toBe(expected);
    });

    it('falls back to npm', () => {
      expect(detectPackageManager(dir, {})).toBe('npm');
    });
  });

  describe('bundler', () => {
    it.each([
      [{ next: '^16.3.1' }, 'next'],
      [{ astro: '^7.1.6' }, 'astro'],
      [{ '@rspack/core': '^2.0.3' }, 'rspack'],
      [{ '@farmfe/core': '^1.7.11' }, 'farm'],
      [{ vite: '^8.0.13' }, 'vite'],
      [{ '@react-router/dev': '^8.3.0' }, 'vite'],
      [{ rolldown: '^1.0.1' }, 'rolldown'],
      [{ rollup: '^4.60.4' }, 'rollup'],
      [{ webpack: '^5.109.2' }, 'webpack'],
      [{ esbuild: '^0.28.0' }, 'esbuild'],
    ])('reads %j as %s', (devDependencies, expected) => {
      expect(detectBundler(dir, { devDependencies })).toBe(expected);
    });

    it('prefers next over the bundler next carries', () => {
      expect(
        detectBundler(dir, {
          dependencies: { next: '^16.3.1', webpack: '^5.0.0' },
        }),
      ).toBe('next');
    });

    it('falls back to a config file when nothing is installed', () => {
      add(dir, 'vite.config.ts', '');
      expect(detectBundler(dir, {})).toBe('vite');
    });

    it('reads a bun lockfile as bun', () => {
      add(dir, 'bun.lockb', '');
      expect(detectBundler(dir, {})).toBe('bun');
    });

    it('finds nothing in an empty project', () => {
      expect(detectBundler(dir, {})).toBeUndefined();
    });
  });

  it('reports what the project already has', () => {
    add(
      dir,
      'package.json',
      manifest({ devDependencies: { vite: '^8.0.13' } }),
    );
    add(dir, 'vite.config.ts', '');
    add(dir, 'eslint.config.ts', '');
    add(dir, 'plumeria.d.ts', '');
    add(dir, 'tsconfig.json', '{}');
    add(dir, 'pnpm-lock.yaml', '');

    expect(detect(dir)).toMatchObject({
      bundler: 'vite',
      bundlerConfig: 'vite.config.ts',
      eslintConfig: 'eslint.config.ts',
      declaration: 'plumeria.d.ts',
      packageManager: 'pnpm',
      typescript: true,
    });
  });

  it('takes the bundler it is given', () => {
    add(
      dir,
      'package.json',
      manifest({ devDependencies: { vite: '^8.0.13' } }),
    );
    expect(detect(dir, 'rollup').bundler).toBe('rollup');
  });

  it('says which bundlers it knows when it finds none', () => {
    add(dir, 'package.json', manifest({}));
    expect(() => detect(dir)).toThrow(/no bundler found/);
  });

  it('says where to run from when there is no package.json', () => {
    expect(() => detect(dir)).toThrow(/no package.json/);
  });

  it('names the config a fresh project would get', () => {
    expect(defaultConfigName('next', true)).toBe('next.config.ts');
    expect(defaultConfigName('next', false)).toBe('next.config.mjs');
    expect(defaultConfigName('vite', true)).toBe('vite.config.ts');
    expect(defaultConfigName('vite', false)).toBe('vite.config.mjs');
  });
});

describe('a package inside a workspace', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-workspace-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('reads the lockfile of the workspace root', () => {
    add(dir, 'pnpm-lock.yaml', '');
    add(dir, 'packages/app/package.json', manifest({}));
    expect(detectPackageManager(path.join(dir, 'packages/app'), {})).toBe(
      'pnpm',
    );
  });

  it('reads the packageManager field of the workspace root', () => {
    add(dir, 'package.json', manifest({ packageManager: 'yarn@4.9.1' }));
    add(dir, 'packages/app/package.json', manifest({}));
    expect(detectPackageManager(path.join(dir, 'packages/app'), {})).toBe(
      'yarn',
    );
  });

  it('still prefers what the package itself declares', () => {
    add(dir, 'pnpm-lock.yaml', '');
    add(
      dir,
      'packages/app/package.json',
      manifest({ packageManager: 'bun@1.2.0' }),
    );
    expect(
      detectPackageManager(path.join(dir, 'packages/app'), {
        packageManager: 'bun@1.2.0',
      }),
    ).toBe('bun');
  });

  it('takes the nearest lockfile when the package has its own', () => {
    add(dir, 'pnpm-lock.yaml', '');
    add(dir, 'packages/app/yarn.lock', '');
    expect(detectPackageManager(path.join(dir, 'packages/app'), {})).toBe(
      'yarn',
    );
  });
});
