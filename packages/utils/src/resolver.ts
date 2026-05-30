import * as fs from 'fs';
import * as path from 'path';

let cachedTsConfig:
  | {
      config: { paths?: Record<string, string[]> } | null;
      basePath: string;
    }
  | null
  | undefined = undefined;

function getTsConfig(): {
  config: { paths?: Record<string, string[]> } | null;
  basePath: string;
} | null {
  if (cachedTsConfig !== undefined) {
    return cachedTsConfig;
  }

  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    try {
      const config = require(tsConfigPath);
      cachedTsConfig = {
        config: config.compilerOptions || null,
        basePath: path.dirname(tsConfigPath),
      };
    } catch {
      cachedTsConfig = null;
    }
  } else {
    cachedTsConfig = null;
  }

  return cachedTsConfig;
}

const extensions = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.jsx',
];

function resolveWithExtension(basePath: string): string | null {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile())
    return basePath;
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile())
      return fullPath;
  }
  return null;
}

export function resolveImportPath(
  importPath: string,
  importerPath: string,
): string | null {
  if (importPath.startsWith('.')) {
    return resolveWithExtension(
      path.resolve(path.dirname(importerPath), importPath),
    );
  }

  const tsConfig = getTsConfig();
  const config = tsConfig?.config;

  if (config?.paths) {
    const root = tsConfig!.basePath;
    for (const [alias, targets] of Object.entries(
      config.paths as Record<string, string[]>,
    )) {
      const prefix = alias.replace(/\*$/, '');
      if (importPath.startsWith(prefix)) {
        for (const target of targets) {
          const resolvedTarget = target.replace(/\*$/, '');
          const candidate = path.resolve(
            root,
            resolvedTarget + importPath.slice(prefix.length),
          );
          const result = resolveWithExtension(candidate);
          if (result) return result;
        }
      }
    }
  }

  let currentDir = path.dirname(importerPath);
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return resolveWithExtension(path.resolve(currentDir, importPath));
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
