import { readPackageJson, writePackageJson } from './package-json.ts';

const ARCH: Record<string, string> = {
  aarch64: 'arm64',
  x86_64: 'x64',
  i686: 'ia32',
  armv7: 'arm',
};

// Maps a Rust target triple to the platform suffix npm expects, e.g.
// `aarch64-apple-darwin` -> `darwin-arm64`.
function platformSuffix(triple: string): string {
  if (triple.startsWith('wasm32')) return 'wasm32-wasi';
  const parts = triple.split('-');
  const arch = ARCH[parts[0]] ?? parts[0];

  if (triple.includes('apple-darwin')) return `darwin-${arch}`;
  if (triple.includes('windows')) return `win32-${arch}-msvc`;
  if (triple.includes('android')) return `android-${arch}`;
  if (triple.includes('freebsd')) return `freebsd-${arch}`;
  return `linux-${arch}-${parts[parts.length - 1]}`;
}

const mainPackage = readPackageJson();
const targets = mainPackage.napi?.targets ?? [];

if (targets.length === 0) {
  console.error('No napi.targets found in package.json');
  process.exit(1);
}

const optionalDependencies: Record<string, string> = {};
for (const triple of targets) {
  optionalDependencies[`${mainPackage.name}-${platformSuffix(triple)}`] =
    mainPackage.version;
}

mainPackage.optionalDependencies = optionalDependencies;
writePackageJson(mainPackage);

console.log(
  `Injected ${targets.length} optionalDependencies at version ${mainPackage.version}`,
);
