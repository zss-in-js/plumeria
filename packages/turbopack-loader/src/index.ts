import * as fs from 'fs';
import * as path from 'path';
import {
  optimizer,
  resolvePropertyPolicy,
  transformSource,
  DEFAULT_STYLE_PROP,
} from '@plumeria/utils';
import type { PropertyPolicyOptions } from '@plumeria/utils';
import { compileCSS } from '@plumeria/compiler';
import { splitCssRules } from './split-css-rules';
import { acquireLock, releaseLockSync } from './file-lock';

const GENERATED_MARKER = '/* plumeria: generated */';
const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/.next/**'];

let productionCss: Promise<void> | null = null;

async function generateProductionCss(
  virtualFilePath: string,
  options: LoaderOptions,
): Promise<void> {
  const lockDir = virtualFilePath + '.lock';
  await acquireLock(lockDir);
  try {
    let current = '';
    try {
      current = fs.readFileSync(virtualFilePath, 'utf-8');
    } catch (e) {
      // ignore
    }

    if (current.startsWith(GENERATED_MARKER)) return;

    const css = compileCSS({
      include: options.include ?? DEFAULT_INCLUDE,
      exclude: options.exclude ?? DEFAULT_EXCLUDE,
      cwd: process.cwd(),
      styleProp: options.styleProp ?? DEFAULT_STYLE_PROP,
      withoutLogicalProperties: options.withoutLogicalProperties,
      withoutPhysicalProperties: options.withoutPhysicalProperties,
    });
    const optimized = await optimizer(css);

    const tempPath = `${virtualFilePath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, `${GENERATED_MARKER}\n${optimized}`, 'utf-8');
    fs.renameSync(tempPath, virtualFilePath);
  } finally {
    releaseLockSync(lockDir);
  }
}

const ensureProductionCss = (
  virtualFilePath: string,
  options: LoaderOptions,
): Promise<void> => {
  if (!productionCss) {
    productionCss = generateProductionCss(virtualFilePath, options).catch(
      (error) => {
        productionCss = null;
        throw error;
      },
    );
  }
  return productionCss;
};

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
  clearDependencies: () => void;
  getOptions?: () => LoaderOptions | undefined;
  query?: LoaderOptions | string;
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
  const isProduction = process.env.NODE_ENV === 'production';
  const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');

  if (
    resourcePath.includes('node_modules') ||
    !source.includes('@plumeria/core')
  ) {
    return callback(null, source);
  }

  try {
    this.clearDependencies();
    this.addDependency(resourcePath);

    const { code: transformedSource, sheets: extractedSheets } =
      await transformSource({
        source,
        moduleId: resourcePath,
        filePath: resourcePath,
        root: process.cwd(),
        styleProp,
        propertyPolicy,
        isDev: !isProduction,
        collectOndemandSheets: !isProduction,
        addDependency: (depPath: string) => this.addDependency(depPath),
      });
    const optInCSS = await optimizer(extractedSheets.join(''));

    let relativeImportPath = path.relative(
      path.dirname(resourcePath),
      VIRTUAL_FILE_PATH,
    );

    relativeImportPath = relativeImportPath.replace(/\\/g, '/');

    if (!relativeImportPath.startsWith('.')) {
      relativeImportPath = './' + relativeImportPath;
    }

    const postfix = `\nimport "${relativeImportPath}";`;

    if (isProduction) {
      await ensureProductionCss(VIRTUAL_FILE_PATH, loaderOptions);
      return callback(null, transformedSource + postfix);
    }

    if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
      const LOCK_DIR_PATH = VIRTUAL_FILE_PATH + '.lock';
      await acquireLock(LOCK_DIR_PATH);

      let currentCss = '';
      try {
        try {
          currentCss = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
        } catch (e) {
          // File doesn't exist yet
        }

        const currentRules = splitCssRules(currentCss);
        const newRules = splitCssRules(optInCSS);

        const ruleSet = new Set(currentRules);
        let hasNewRule = false;

        for (const rule of newRules) {
          if (!ruleSet.has(rule)) {
            ruleSet.add(rule);
            hasNewRule = true;
          }
        }

        if (hasNewRule) {
          const nextCss = await optimizer(Array.from(ruleSet).join('\n\n'));
          fs.writeFileSync(VIRTUAL_FILE_PATH, nextCss, 'utf-8');
        }
      } catch (innerError) {
        try {
          fs.writeFileSync(VIRTUAL_FILE_PATH, currentCss, 'utf-8');
        } catch (e) {
          // Ignore
        }
        throw innerError;
      } finally {
        releaseLockSync(LOCK_DIR_PATH);
      }
    }

    return callback(null, transformedSource + postfix);
  } catch (error) {
    return callback(error as Error);
  }
}
