import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/**
 * Shared disk-based CSS HMR utility.
 *
 * Writes CSS to a real file on disk using marker-based blocks per source file.
 * The bundler's file watcher detects changes and triggers HMR automatically.
 *
 * This is the same approach used by @plumeria/turbopack-loader.
 */

const VIRTUAL_CSS_FILENAME = 'zero-virtual.css';

let _cachedVirtualCssPath: string | null = null;

/**
 * Resolve the path to the shared virtual CSS file.
 * Located at the root of the @plumeria/unplugin package.
 */
export function resolveVirtualCssPath(): string {
  if (_cachedVirtualCssPath) return _cachedVirtualCssPath;

  // In CJS, __dirname is available and points to dist/
  // In ESM, __dirname is undefined, so we use createRequire to locate the package
  let packageRoot: string;

  if (typeof __dirname !== 'undefined') {
    // CJS: __dirname = .../packages/unplugin/dist
    packageRoot = path.resolve(__dirname, '..');
  } else {
    // ESM: resolve via the package's own entry point
    try {
      const req = createRequire(process.cwd() + '/');
      const entryPath = req.resolve('@plumeria/unplugin');
      // entryPath = .../packages/unplugin/dist/index.js
      packageRoot = path.resolve(path.dirname(entryPath), '..');
    } catch {
      // Fallback: use CWD (should rarely happen)
      packageRoot = process.cwd();
    }
  }

  _cachedVirtualCssPath = path.resolve(packageRoot, VIRTUAL_CSS_FILENAME);
  return _cachedVirtualCssPath;
}

/**
 * Ensure the virtual CSS file exists on disk.
 */
export function ensureVirtualCssFile(virtualCssPath: string): void {
  if (!fs.existsSync(virtualCssPath)) {
    fs.writeFileSync(virtualCssPath, '/** Placeholder file */\n', 'utf-8');
  }
}

/**
 * Write a CSS block to the shared virtual CSS file on disk,
 * using start/end markers per source file to support incremental updates.
 *
 * @param virtualCssPath - Absolute path to the virtual CSS file
 * @param filePathKey - Unique key identifying the source file (e.g. relative path)
 * @param cssContent - The CSS content to write
 */
export function writeCssBlock(
  virtualCssPath: string,
  filePathKey: string,
  cssContent: string,
): void {
  const startMarker = `/* ---start:${filePathKey} */`;
  const endMarker = `/* ---end:${filePathKey} */`;

  let currentCss = '';
  try {
    currentCss = fs.readFileSync(virtualCssPath, 'utf-8');
  } catch {
    // File doesn't exist yet
  }

  const cleanCss = cssContent.trim();
  const newBlock = cleanCss ? `${startMarker}\n${cleanCss}\n${endMarker}` : '';

  let nextCss = currentCss;
  const startIndex = currentCss.indexOf(startMarker);
  const endIndex = currentCss.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Replace existing block for this file
    const before = currentCss.substring(0, startIndex);
    const after = currentCss.substring(endIndex + endMarker.length);
    nextCss = before + newBlock + after;
  } else if (newBlock) {
    // Append new block
    nextCss = currentCss + (currentCss.trim() ? '\n\n' : '') + newBlock;
  }

  // Clean up excessive blank lines
  nextCss = nextCss.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  // Only write if content changed (avoids unnecessary HMR triggers)
  if (currentCss !== nextCss) {
    fs.writeFileSync(virtualCssPath, nextCss, 'utf-8');
  }
}

/**
 * Rewrite a virtual CSS import to point to the real disk file.
 * Returns a relative import path suitable for the source file.
 */
export function rewriteImportPath(
  sourceFilePath: string,
  virtualCssPath: string,
): string {
  let relativeImportPath = path.relative(
    path.dirname(sourceFilePath),
    virtualCssPath,
  );
  relativeImportPath = relativeImportPath.replace(/\\/g, '/');
  if (!relativeImportPath.startsWith('.')) {
    relativeImportPath = './' + relativeImportPath;
  }
  return relativeImportPath;
}
