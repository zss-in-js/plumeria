import fs from 'node:fs';
import path from 'node:path';
import {
  npmDir,
  platformDirectories,
  readPackageJson,
} from './package-json.ts';

const mainPackage = readPackageJson();

const RUST_OS: Record<string, string> = {
  darwin: 'apple-darwin',
  linux: 'unknown-linux',
  win32: 'pc-windows-msvc',
  android: 'linux-android',
  freebsd: 'unknown-freebsd',
};

const RUST_ARCH: Record<string, string> = {
  x64: 'x86_64',
  ia32: 'i686',
  arm64: 'aarch64',
  arm: 'armv7',
};

function getRustTarget(platform: string): string {
  if (platform === 'wasm32-wasi') return 'wasm32-wasip1-threads';
  const [os, arch, libcOrMsvc] = platform.split('-');
  const rustOS = RUST_OS[os];
  const rustArch = RUST_ARCH[arch];

  return os === 'linux'
    ? `${rustArch}-${rustOS}-${libcOrMsvc}`
    : `${rustArch}-${rustOS}`;
}

for (const platform of platformDirectories()) {
  const readme = `# \`${mainPackage.name}-${platform}\`

This is the **${getRustTarget(platform)}** binary for \`${mainPackage.name}\`
`;

  fs.writeFileSync(path.join(npmDir, platform, 'README.md'), readme);
}
