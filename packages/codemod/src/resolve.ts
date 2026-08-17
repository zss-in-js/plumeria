/**
 * @fileoverview Resolve an import specifier to a file the codemod has scanned
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createPathsMatcher, getTsconfig } from 'get-tsconfig';

const EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
];

const CANDIDATES = [
  ...EXTENSIONS,
  ...EXTENSIONS.map((extension) => `${path.sep}index${extension}`),
];

const REWRITTEN: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

let cachedMatcher: ((specifier: string) => string[]) | null | undefined;

const pathsMatcher = () => {
  if (cachedMatcher === undefined) {
    const tsconfig = getTsconfig(process.cwd());
    cachedMatcher = tsconfig ? createPathsMatcher(tsconfig) : null;
  }
  return cachedMatcher;
};

export const resetTsconfigCache = (): void => {
  cachedMatcher = undefined;
};

const isFile = (candidate: string): boolean =>
  fs.statSync(candidate, { throwIfNoEntry: false })?.isFile() ?? false;

const resolveFile = (base: string): string | null => {
  if (isFile(base)) return base;

  const extension = path.extname(base);
  for (const rewritten of REWRITTEN[extension] ?? []) {
    const candidate = `${base.slice(0, -extension.length)}${rewritten}`;
    if (isFile(candidate)) return candidate;
  }

  for (const candidate of CANDIDATES) {
    if (isFile(base + candidate)) return base + candidate;
  }
  return null;
};

export function resolveSourcePath(
  specifier: string,
  importer: string,
): string | null {
  if (specifier === '@plumeria/core') return null;

  if (specifier.startsWith('.')) {
    return resolveFile(path.resolve(path.dirname(importer), specifier));
  }

  const matcher = pathsMatcher();
  if (!matcher) return null;
  for (const candidate of matcher(specifier)) {
    const resolved = resolveFile(candidate);
    if (resolved) return resolved;
  }
  return null;
}
