import * as fs from 'fs';
import * as path from 'path';

interface Pattern {
  prefix: string;
  suffix: string;
  wildcard: boolean;
  basePath: string;
  targets: string[];
}

interface TsConfig {
  extends?: string | string[];
  references?: { path?: string }[];
  compilerOptions?: { paths?: Record<string, string[]> };
}

interface PackageManifest {
  exports?: unknown;
  tsconfig?: unknown;
}

const CONFIG_DIR = '${configDir}';

type PathsMatcher = (specifier: string) => string[];

let cachedPathsMatcher: PathsMatcher | null | undefined = undefined;

function stripComments(text: string): string {
  let out = '';
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (char === '\\') {
        out += char + (text[i + 1] ?? '');
        i++;
        continue;
      }
      if (char === '"') inString = false;
      out += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
      continue;
    }

    if (char === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      out += ' ';
      continue;
    }

    out += char;
  }

  return out;
}

function stripTrailingCommas(text: string): string {
  let out = '';
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (char === '\\') {
        out += char + (text[i + 1] ?? '');
        i++;
        continue;
      }
      if (char === '"') inString = false;
      out += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === ',') {
      let next = i + 1;
      while (next < text.length && /\s/.test(text[next])) next++;
      if (text[next] === '}' || text[next] === ']') continue;
    }

    out += char;
  }

  return out;
}

function readConfig<T = TsConfig>(configPath: string): T | null {
  let text: string;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch {
    return null;
  }

  try {
    const config = JSON.parse(
      stripTrailingCommas(stripComments(text.replace(/^\uFEFF/, ''))),
    );
    return config && typeof config === 'object' ? config : null;
  } catch {
    return null;
  }
}

function configFileAt(candidate: string): string {
  return fs.statSync(candidate, { throwIfNoEntry: false })?.isDirectory()
    ? path.join(candidate, 'tsconfig.json')
    : candidate;
}

function packageNameOf(specifier: string): string {
  const segments = specifier.split('/');
  return specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0];
}

function resolveQuietly(specifier: string, basePath: string): string | null {
  try {
    return require.resolve(specifier, { paths: [basePath] });
  } catch {
    return null;
  }
}

function resolveExtendsPath(
  specifier: string,
  basePath: string,
): string | null {
  if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
    const resolved = configFileAt(path.resolve(basePath, specifier));
    if (isFile(resolved)) return resolved;
    const withExtension = resolved + '.json';
    return isFile(withExtension) ? withExtension : null;
  }

  const packageName = packageNameOf(specifier);
  const exported = () => {
    const resolved = resolveQuietly(specifier, basePath);
    return resolved?.endsWith('.json') ? resolved : null;
  };

  if (specifier !== packageName) return exported();

  const manifestPath = resolveQuietly(`${packageName}/package.json`, basePath);
  if (!manifestPath) return exported();

  const manifest = readConfig<PackageManifest>(manifestPath);
  if (manifest?.exports !== undefined) {
    const resolved = exported();
    if (resolved) return resolved;
  }

  const packageDir = path.dirname(manifestPath);

  if (typeof manifest?.tsconfig === 'string') {
    const declared = configFileAt(path.resolve(packageDir, manifest.tsconfig));
    if (isFile(declared)) return declared;
  }

  const fallback = path.join(packageDir, 'tsconfig.json');
  return isFile(fallback) ? fallback : null;
}

function patternsOf(
  paths: Record<string, string[]> | undefined,
  basePath: string,
  entryPath: string,
): Pattern[] | null {
  if (!paths || typeof paths !== 'object') return null;

  const patterns: Pattern[] = [];

  for (const [alias, targets] of Object.entries(paths)) {
    if (!Array.isArray(targets) || targets.length === 0) continue;

    const written = targets.filter(
      (target): target is string => typeof target === 'string',
    );
    if (written.length === 0) continue;

    const star = alias.indexOf('*');

    patterns.push({
      prefix: star < 0 ? alias : alias.slice(0, star),
      suffix: star < 0 ? '' : alias.slice(star + 1),
      wildcard: star >= 0,
      basePath,
      targets: written.map((target) =>
        target.startsWith(CONFIG_DIR)
          ? path.join(entryPath, target.slice(CONFIG_DIR.length))
          : target,
      ),
    });
  }

  return patterns;
}

function collectPatterns(
  configPath: string,
  seen: Set<string>,
  entryPath: string = path.dirname(configPath),
): Pattern[] | null {
  if (seen.has(configPath)) return null;
  seen.add(configPath);

  const config = readConfig(configPath);
  if (!config) return null;

  const basePath = path.dirname(configPath);

  const own = patternsOf(config.compilerOptions?.paths, basePath, entryPath);
  if (own) return own;

  const inherited = Array.isArray(config.extends)
    ? config.extends.slice().reverse()
    : config.extends
      ? [config.extends]
      : [];

  for (const specifier of inherited) {
    const resolved = resolveExtendsPath(specifier, basePath);
    if (!resolved) continue;
    const patterns = collectPatterns(resolved, seen, entryPath);
    if (patterns) return patterns;
  }

  for (const reference of config.references ?? []) {
    if (!reference?.path) continue;
    const patterns = collectPatterns(
      configFileAt(path.resolve(basePath, reference.path)),
      seen,
    );
    if (patterns) return patterns;
  }

  return null;
}

function buildMatcher(patterns: Pattern[]): PathsMatcher {
  const exact = patterns.filter((pattern) => !pattern.wildcard);
  const wildcard = patterns
    .filter((pattern) => pattern.wildcard)
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return (specifier: string) => {
    for (const pattern of exact) {
      if (pattern.prefix === specifier) {
        return pattern.targets.map((target) =>
          path.resolve(pattern.basePath, target),
        );
      }
    }

    for (const pattern of wildcard) {
      if (
        specifier.length >= pattern.prefix.length + pattern.suffix.length &&
        specifier.startsWith(pattern.prefix) &&
        specifier.endsWith(pattern.suffix)
      ) {
        const matched = specifier.slice(
          pattern.prefix.length,
          specifier.length - pattern.suffix.length,
        );
        return pattern.targets.map((target) =>
          path.resolve(pattern.basePath, target.replace('*', matched)),
        );
      }
    }

    return [];
  };
}

function loadPathsMatcher(configPath: string): PathsMatcher | null {
  const patterns = collectPatterns(configPath, new Set());
  return patterns ? buildMatcher(patterns) : null;
}

export function resetImportResolutionCache(cwd: string = process.cwd()): void {
  cachedPathsMatcher = loadPathsMatcher(path.join(cwd, 'tsconfig.json'));
}

function getPathsMatcher(): PathsMatcher | null {
  if (cachedPathsMatcher !== undefined) return cachedPathsMatcher;

  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  cachedPathsMatcher = fs.existsSync(tsConfigPath)
    ? loadPathsMatcher(tsConfigPath)
    : null;

  return cachedPathsMatcher;
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

function isFile(candidate: string): boolean {
  return fs.statSync(candidate, { throwIfNoEntry: false })?.isFile() ?? false;
}

function resolveWithExtension(basePath: string): string | null {
  if (isFile(basePath)) return basePath;
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (isFile(fullPath)) return fullPath;
  }
  return null;
}

export function resolveImportPath(
  importPath: string,
  importerPath: string,
): string | null {
  if (importPath === '@plumeria/core') return null;

  if (importPath.startsWith('.')) {
    return resolveWithExtension(
      path.resolve(path.dirname(importerPath), importPath),
    );
  }

  const matchPaths = getPathsMatcher();

  if (matchPaths) {
    for (const candidate of matchPaths(importPath)) {
      const result = resolveWithExtension(candidate);
      if (result) return result;
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
