import fs from 'fs';
import path from 'path';

let tsConfigCache: { paths?: Record<string, string[]> } | null | undefined;

function loadTsConfig() {
  if (tsConfigCache !== undefined) return tsConfigCache;

  let currentDir = process.cwd();
  while (currentDir !== path.parse(currentDir).root) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const content = fs.readFileSync(tsConfigPath, 'utf-8');
        const config = JSON.parse(
          content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''),
        );
        tsConfigCache = config.compilerOptions || null;
        return tsConfigCache;
      } catch {
        // ignore parse error
      }
    }
    currentDir = path.dirname(currentDir);
  }

  tsConfigCache = null;
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
  // 1. Relative path
  if (importPath.startsWith('.')) {
    return resolveWithExtension(
      path.resolve(path.dirname(importerPath), importPath),
    );
  }

  // 2. tsconfig paths
  const config = loadTsConfig();
  if (config?.paths) {
    const root = process.cwd();
    for (const [alias, targets] of Object.entries(config.paths)) {
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

  // 3. Simple absolute resolve from package.json root (Fallback)
  let currentDir = path.dirname(importerPath);
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return resolveWithExtension(path.resolve(currentDir, importPath));
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
