import fs from 'node:fs';
import path from 'node:path';
import {
  npmDir,
  platformDirectories,
  readPackageJson,
  type PackageJson,
} from './package-json.ts';

const mainPackage = readPackageJson();

const unscopedName = mainPackage.name.startsWith('@')
  ? mainPackage.name.split('/')[1]
  : mainPackage.name;

function getOS(platform: string): string[] {
  return [platform.split('-')[0]];
}

function getCPU(platform: string): string[] {
  return [platform.split('-')[1]];
}

// Only the three-part linux platforms carry a libc, e.g. `linux-x64-musl`.
function getLibc(platform: string): string[] | undefined {
  const parts = platform.split('-');
  if (parts.length !== 3) return undefined;
  if (parts[2] === 'musl') return ['musl'];
  if (parts[2] === 'gnu') return ['glibc'];
  return undefined;
}

type PlatformPackage = PackageJson & {
  main: string;
  browser?: string;
  files: string[];
  engines: { node: string };
  os?: string[];
  cpu: string[];
  libc?: string[];
  license: string;
  dependencies?: Record<string, string>;
  publishConfig: { registry: string; access: string };
};

function wasmFields(): Partial<PlatformPackage> {
  return {
    main: `${unscopedName}.wasi.cjs`,
    browser: `${unscopedName}.wasi-browser.js`,
    files: [
      `${unscopedName}.wasm32-wasi.wasm`,
      `${unscopedName}.wasi.cjs`,
      `${unscopedName}.wasi-browser.js`,
      'wasi-worker.mjs',
      'wasi-worker-browser.mjs',
    ],
    engines: { node: '>=14.0.0' },
    cpu: ['wasm32'],
    dependencies: {
      '@napi-rs/wasm-runtime':
        mainPackage.devDependencies?.['@napi-rs/wasm-runtime'] ?? '*',
    },
  };
}

function nativeFields(platform: string): Partial<PlatformPackage> {
  const binaryName = `${unscopedName}.${platform}.node`;
  const libc = getLibc(platform);
  return {
    main: binaryName,
    files: [binaryName],
    engines: { node: '>= 10' },
    os: getOS(platform),
    cpu: getCPU(platform),
    ...(libc && { libc }),
  };
}

for (const platform of platformDirectories()) {
  const platformPackage = {
    name: `${mainPackage.name}-${platform}`,
    version: mainPackage.version,
    description: mainPackage.description,
    keywords: [...(mainPackage.keywords ?? [])],
    repository: mainPackage.repository ?? {},
    license: mainPackage.license ?? 'MIT',
    author: mainPackage.author,
    ...(platform === 'wasm32-wasi' ? wasmFields() : nativeFields(platform)),
    publishConfig: {
      registry: 'https://registry.npmjs.org/',
      access: 'public',
    },
  };

  fs.writeFileSync(
    path.join(npmDir, platform, 'package.json'),
    JSON.stringify(platformPackage, null, 2),
  );
}
