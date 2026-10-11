import * as fs from 'fs';
import * as path from 'path';
import { compileCSS, optimizer, DEFAULT_STYLE_PROP } from '@plumeria/compiler';
import type { LoaderOptions } from './index';

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/.next/**'];
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const SKIPPED_DIRS = new Set(['node_modules', '.next', '.git']);

interface CssLoaderContext {
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  getOptions?: () => LoaderOptions | undefined;
  query?: LoaderOptions | string;
}

function watchSources(context: CssLoaderContext, dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) watchSources(context, entryPath);
    else if (SOURCE_FILE.test(entry.name)) context.addDependency(entryPath);
  }
}

export default function cssLoader(this: CssLoaderContext) {
  const callback = this.async();
  const options: LoaderOptions =
    this.getOptions?.() ??
    (typeof this.query === 'object' ? this.query : undefined) ??
    {};
  const cwd = process.cwd();

  try {
    watchSources(this, cwd);
    const css = compileCSS({
      include: options.include ?? DEFAULT_INCLUDE,
      exclude: options.exclude ?? DEFAULT_EXCLUDE,
      cwd,
      styleProp: options.styleProp ?? DEFAULT_STYLE_PROP,
      withoutLogicalProperties: options.withoutLogicalProperties,
      withoutPhysicalProperties: options.withoutPhysicalProperties,
    });
    callback(null, optimizer(css));
  } catch (error) {
    callback(error as Error);
  }
}
