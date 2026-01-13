import fs from 'fs';
import path from 'path';

const tsConfigCache = new Map<
  string,
  { paths?: Record<string, string[]> } | null
>();
const tsConfigPathCache = new Map<string, string | null>();

function getTsConfig(startDir: string): {
  config: { paths?: Record<string, string[]> } | null;
  basePath: string;
} | null {
  let currentDir = startDir;

  if (tsConfigPathCache.has(currentDir)) {
    const cachedPath = tsConfigPathCache.get(currentDir);
    if (cachedPath === null) return null;
    return {
      config: tsConfigCache.get(cachedPath as string) ?? null,
      basePath: path.dirname(cachedPath as string),
    };
  }

  while (currentDir !== path.parse(currentDir).root) {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      if (!tsConfigCache.has(tsConfigPath)) {
        try {
          const config = require(tsConfigPath);
          tsConfigCache.set(tsConfigPath, config.compilerOptions || null);
        } catch {
          tsConfigCache.set(tsConfigPath, null);
        }
      }

      tsConfigPathCache.set(startDir, tsConfigPath);

      return {
        config: tsConfigCache.get(tsConfigPath) ?? null,
        basePath: currentDir,
      };
    }
    currentDir = path.dirname(currentDir);
  }

  tsConfigPathCache.set(startDir, null);
  return null;
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

  const tsConfig = getTsConfig(path.dirname(importerPath));
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
