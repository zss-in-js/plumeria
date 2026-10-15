import * as fs from 'fs';
import * as path from 'path';
import { optimizer } from '@plumeria/compiler';
import {
  compileStylesheet,
  devGenerationsPath,
  generationMarker,
  watchSources,
} from './index';
import type { LoaderOptions } from './index';

interface CssLoaderContext {
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  emitError?: (error: Error) => void;
  getOptions?: () => LoaderOptions | undefined;
  query?: LoaderOptions | string;
}

const KEPT_GENERATIONS = 3;

function readGenerations(file: string): string[] {
  try {
    const stored: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(stored)
      ? stored.filter((css): css is string => typeof css === 'string')
      : [];
  } catch {
    return [];
  }
}

function withPreviousGenerations(cwd: string, css: string): string {
  const file = devGenerationsPath(cwd);
  const stored = readGenerations(file);
  if (stored[stored.length - 1] === css) return stored.join('\n');
  const generations = [...stored, css].slice(-KEPT_GENERATIONS);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(generations), 'utf-8');
  return generations.join('\n');
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
    const css = compileStylesheet(options, cwd);
    callback(
      null,
      optimizer(
        process.env.NODE_ENV === 'development'
          ? withPreviousGenerations(cwd, `${css}\n${generationMarker(css)}`)
          : css,
      ),
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'development' || !this.emitError) {
      return callback(error as Error);
    }
    this.emitError(error as Error);
    callback(
      null,
      optimizer(readGenerations(devGenerationsPath(cwd)).join('\n')),
    );
  }
}
