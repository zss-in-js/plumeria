import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  resolvePropertyPolicy,
  transformSource,
  DEFAULT_STYLE_PROP,
  needsCompile,
} from '@plumeria/compiler';
import type { PropertyPolicyOptions } from '@plumeria/compiler';

export interface LoaderOptions extends PropertyPolicyOptions {
  include?: string[];
  exclude?: string[];
  styleProp?: string;
}

interface LoaderContext {
  resourcePath: string;
  context: string;
  rootContext: string;
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  emitError?: (error: Error) => void;
  clearDependencies: () => void;
  getOptions?: () => LoaderOptions | undefined;
  query?: LoaderOptions | string;
}

export const VIRTUAL_FILE_PATH = path.resolve(
  __dirname,
  '..',
  'zero-virtual.css',
);

const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const SKIPPED_DIRS = new Set(['node_modules', '.next', '.git']);

export function watchSources(
  context: { addDependency: (path: string) => void },
  dir: string,
): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) watchSources(context, entryPath);
    else if (SOURCE_FILE.test(entry.name)) context.addDependency(entryPath);
  }
}

export const devGenerationsPath = (cwd: string) =>
  path.join(
    os.tmpdir(),
    'plumeria',
    `${crypto.createHash('sha1').update(cwd).digest('hex')}.json`,
  );

export default async function loader(this: LoaderContext, source: string) {
  const callback = this.async();
  const loaderOptions: LoaderOptions =
    this.getOptions?.() ??
    (typeof this.query === 'object' ? this.query : undefined) ??
    {};
  const styleProp = loaderOptions.styleProp ?? DEFAULT_STYLE_PROP;
  const propertyPolicy = resolvePropertyPolicy(loaderOptions);
  const resourcePath = this.resourcePath;

  if (
    resourcePath.includes('node_modules') ||
    !needsCompile(source, styleProp, resourcePath)
  ) {
    return callback(null, source);
  }

  try {
    this.clearDependencies();
    this.addDependency(resourcePath);

    const { code: transformedSource } = transformSource({
      source,
      moduleId: resourcePath,
      filePath: resourcePath,
      root: process.cwd(),
      styleProp,
      propertyPolicy,
      isDev: process.env.NODE_ENV !== 'production',
      addDependency: (depPath: string) => this.addDependency(depPath),
    });

    let relativeImportPath = path.relative(
      path.dirname(resourcePath),
      VIRTUAL_FILE_PATH,
    );

    relativeImportPath = relativeImportPath.replace(/\\/g, '/');

    if (!relativeImportPath.startsWith('.')) {
      relativeImportPath = './' + relativeImportPath;
    }

    return callback(
      null,
      `${transformedSource}\nimport "${relativeImportPath}";`,
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'development' || !this.emitError) {
      return callback(error as Error);
    }
    watchSources(this, process.cwd());
    this.emitError(error as Error);
    return callback(
      null,
      `throw new Error(${JSON.stringify((error as Error).message)});`,
    );
  }
}
