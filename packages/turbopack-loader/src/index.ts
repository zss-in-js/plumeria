import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  compileCSS,
  optimizer,
  resolvePropertyPolicy,
  transformSource,
  DEFAULT_STYLE_PROP,
  needsCompile,
} from '@plumeria/compiler';
import type { PropertyPolicyOptions } from '@plumeria/compiler';
import { carryStylesheet } from './dev-bridge-client';

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

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/.next/**'];

export function compileStylesheet(options: LoaderOptions, cwd: string) {
  return compileCSS({
    include: options.include ?? DEFAULT_INCLUDE,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    cwd,
    styleProp: options.styleProp ?? DEFAULT_STYLE_PROP,
    withoutLogicalProperties: options.withoutLogicalProperties,
    withoutPhysicalProperties: options.withoutPhysicalProperties,
  });
}

export const generationId = (css: string) =>
  crypto.createHash('sha1').update(css).digest('hex').slice(0, 16);

export const generationMarker = (css: string) =>
  `[data-plumeria-generation="${generationId(css)}"] { --plumeria-generation: 1; }`;

export const DEV_BRIDGE_ID = 'plumeria-dev-bridge';
export const DEV_BRIDGE_WINDOW_MS = 30_000;

const bridgeScript = (css: string, id: string) =>
  `\n(${carryStylesheet})(${JSON.stringify(css)}, ${JSON.stringify(id)}, ${JSON.stringify(DEV_BRIDGE_ID)});\n`;

const editedWithinWindow = (file: string) => {
  try {
    return Date.now() - fs.statSync(file).mtimeMs <= DEV_BRIDGE_WINDOW_MS;
  } catch {
    return false;
  }
};

const transformedOutputs = new Map<
  string,
  { digest: string; edited: boolean }
>();

const outputEdited = (resourcePath: string, code: string) => {
  const digest = crypto.createHash('sha1').update(code).digest('hex');
  const previous = transformedOutputs.get(resourcePath);
  const edited =
    previous !== undefined && (previous.digest !== digest || previous.edited);
  transformedOutputs.set(resourcePath, { digest, edited });
  return edited;
};

export function devBridge(
  module: { resourcePath: string; code: string; dependencies: string[] },
  options: LoaderOptions,
  cwd: string,
): string {
  if (process.env.NODE_ENV !== 'development') return '';
  if (!outputEdited(module.resourcePath, module.code)) return '';
  if (![module.resourcePath, ...module.dependencies].some(editedWithinWindow))
    return '';
  try {
    const css = compileStylesheet(options, cwd);
    return bridgeScript(optimizer(css), generationId(css));
  } catch {
    return '';
  }
}

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

    const { code: transformedSource, dependencies } = transformSource({
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
      `${transformedSource}\nimport "${relativeImportPath}";${devBridge({ resourcePath, code: transformedSource, dependencies }, loaderOptions, process.cwd())}`,
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
