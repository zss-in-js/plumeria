import fs from 'node:fs';
import path from 'node:path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export type Bundler =
  | 'next'
  | 'vite'
  | 'astro'
  | 'webpack'
  | 'rspack'
  | 'rollup'
  | 'rolldown'
  | 'esbuild'
  | 'farm'
  | 'bun';

export interface Manifest {
  type?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface Detected {
  root: string;
  manifest: Manifest;
  packageManager: PackageManager;
  bundler: Bundler;
  bundlerConfig: string | undefined;
  eslintConfig: string | undefined;
  declaration: string | undefined;
  typescript: boolean;
  esm: boolean;
}

export const BUNDLERS: readonly Bundler[] = [
  'next',
  'vite',
  'astro',
  'webpack',
  'rspack',
  'rollup',
  'rolldown',
  'esbuild',
  'farm',
  'bun',
];

const LOCKFILES: readonly [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

const CONFIG_NAMES: Record<Bundler, readonly string[]> = {
  next: [
    'next.config.ts',
    'next.config.mts',
    'next.config.mjs',
    'next.config.js',
    'next.config.cjs',
  ],
  vite: [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.mjs',
    'vite.config.js',
  ],
  astro: [
    'astro.config.ts',
    'astro.config.mts',
    'astro.config.mjs',
    'astro.config.js',
  ],
  webpack: [
    'webpack.config.ts',
    'webpack.config.mjs',
    'webpack.config.js',
    'webpack.config.cjs',
  ],
  rspack: [
    'rspack.config.ts',
    'rspack.config.mjs',
    'rspack.config.js',
    'rspack.config.cjs',
  ],
  rollup: ['rollup.config.ts', 'rollup.config.mjs', 'rollup.config.js'],
  rolldown: ['rolldown.config.ts', 'rolldown.config.mjs', 'rolldown.config.js'],
  esbuild: ['build.ts', 'build.mjs', 'build.js', 'esbuild.config.js'],
  farm: ['farm.config.ts', 'farm.config.mjs', 'farm.config.js'],
  bun: ['build.ts', 'build.mjs', 'build.js'],
};

const ESLINT_NAMES = [
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.mjs',
  'eslint.config.js',
  'eslint.config.cjs',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc',
];

const DECLARATION_NAMES = [
  'plumeria.d.ts',
  'src/plumeria.d.ts',
  'app/plumeria.d.ts',
  'types/plumeria.d.ts',
];

export const readManifest = (root: string): Manifest => {
  const file = path.join(root, 'package.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      `no package.json in ${root}. Run this from the project root.`,
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest;
};

export const installed = (manifest: Manifest): Record<string, string> => ({
  ...manifest.dependencies,
  ...manifest.devDependencies,
});

export const detectPackageManager = (
  root: string,
  manifest: Manifest,
): PackageManager => {
  const declared = manifest.packageManager?.split('@')[0];
  if (
    declared === 'pnpm' ||
    declared === 'yarn' ||
    declared === 'bun' ||
    declared === 'npm'
  ) {
    return declared;
  }
  for (const [lockfile, manager] of LOCKFILES) {
    if (fs.existsSync(path.join(root, lockfile))) return manager;
  }
  return 'npm';
};

const firstExisting = (
  root: string,
  names: readonly string[],
): string | undefined =>
  names.find((name) => fs.existsSync(path.join(root, name)));

export const detectBundler = (
  root: string,
  manifest: Manifest,
): Bundler | undefined => {
  const deps = installed(manifest);
  const has = (name: string) => name in deps;

  if (has('next')) return 'next';
  if (has('astro')) return 'astro';
  if (has('@rspack/core') || has('@rspack/cli')) return 'rspack';
  if (has('@farmfe/core')) return 'farm';
  if (has('vite') || has('@react-router/dev')) return 'vite';
  if (has('rolldown')) return 'rolldown';
  if (has('rollup')) return 'rollup';
  if (has('webpack')) return 'webpack';
  if (has('esbuild')) return 'esbuild';

  for (const bundler of BUNDLERS) {
    if (bundler === 'bun') continue;
    if (firstExisting(root, CONFIG_NAMES[bundler])) return bundler;
  }

  if (
    fs.existsSync(path.join(root, 'bun.lock')) ||
    fs.existsSync(path.join(root, 'bun.lockb'))
  ) {
    return 'bun';
  }
  return undefined;
};

export const detect = (root: string, override?: Bundler): Detected => {
  const manifest = readManifest(root);
  const bundler = override ?? detectBundler(root, manifest);

  if (!bundler) {
    throw new Error(
      `no bundler found. Pass --bundler <${BUNDLERS.join('|')}>.`,
    );
  }

  const declaration = firstExisting(root, DECLARATION_NAMES);
  const typescript =
    fs.existsSync(path.join(root, 'tsconfig.json')) ||
    'typescript' in installed(manifest);

  return {
    root,
    manifest,
    packageManager: detectPackageManager(root, manifest),
    bundler,
    bundlerConfig: firstExisting(root, CONFIG_NAMES[bundler]),
    eslintConfig: firstExisting(root, ESLINT_NAMES),
    declaration,
    typescript,
    esm: manifest.type === 'module',
  };
};

export const defaultConfigName = (
  bundler: Bundler,
  typescript: boolean,
): string => {
  const names = CONFIG_NAMES[bundler];
  const ending = (suffix: string) =>
    names.find((name) => name.endsWith(suffix));
  if (typescript) return ending('.ts') ?? names[0];
  return ending('.mjs') ?? ending('.js') ?? names[0];
};

export const configNames = (bundler: Bundler): readonly string[] =>
  CONFIG_NAMES[bundler];
