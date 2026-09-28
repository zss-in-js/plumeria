import fs from 'node:fs';
import path from 'node:path';

export type PackageJson = {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  repository?: { type?: string; url?: string };
  author?: string;
  license?: string;
  napi?: { binaryName?: string; targets?: string[] };
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

// Every script here runs with the package it operates on as the working
// directory, which is how `pnpm -r` and the publish workflow invoke them.
export const packageRoot = process.cwd();
export const packageJsonPath = path.join(packageRoot, 'package.json');
export const npmDir = path.join(packageRoot, 'npm');

export function readPackageJson(): PackageJson {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
}

export function writePackageJson(value: PackageJson): void {
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(value, null, 2)}\n`);
}

// The per-platform directories napi writes under npm/, e.g. `darwin-arm64`.
export function platformDirectories(): string[] {
  return fs
    .readdirSync(npmDir)
    .filter((entry) => fs.statSync(path.join(npmDir, entry)).isDirectory());
}
