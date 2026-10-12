import * as fs from 'fs';
import * as path from 'path';
import { compileCSS, optimizer, DEFAULT_STYLE_PROP } from '@plumeria/compiler';
import { devGenerationsPath, watchSources } from './index';
import type { LoaderOptions } from './index';

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/.next/**'];

interface CssLoaderContext {
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  emitError?: (error: Error) => void;
  getOptions?: () => LoaderOptions | undefined;
  query?: LoaderOptions | string;
}

type Generations = { previous: string; current: string };

function readGenerations(file: string): Generations {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Generations;
  } catch {
    return { previous: '', current: '' };
  }
}

function withPreviousGeneration(cwd: string, css: string): string {
  const file = devGenerationsPath(cwd);
  const stored = readGenerations(file);
  const generations =
    stored.current === css
      ? stored
      : { previous: stored.current, current: css };
  if (generations !== stored) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(generations), 'utf-8');
  }
  return generations.previous ? `${generations.previous}\n${css}` : css;
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
    callback(
      null,
      optimizer(
        process.env.NODE_ENV === 'development'
          ? withPreviousGeneration(cwd, css)
          : css,
      ),
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'development' || !this.emitError) {
      return callback(error as Error);
    }
    this.emitError(error as Error);
    const stored = readGenerations(devGenerationsPath(cwd));
    callback(null, optimizer(`${stored.previous}\n${stored.current}`));
  }
}
