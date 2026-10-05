import swcJest from '@swc/jest';
import {
  transformSource,
  resolvePropertyPolicy,
  DEFAULT_STYLE_PROP,
  needsCompile,
} from '@plumeria/compiler';
import type { PropertyPolicyOptions } from '@plumeria/compiler';

type SwcOptions = NonNullable<Parameters<typeof swcJest.createTransformer>[0]>;
type SwcTransformer = ReturnType<typeof swcJest.createTransformer>;

export interface TransformerOptions extends SwcOptions, PropertyPolicyOptions {
  styleProp?: string;
}

interface JestOptions {
  config: { rootDir: string };
}

export function createTransformer(
  options: TransformerOptions = {},
): SwcTransformer {
  const {
    styleProp = DEFAULT_STYLE_PROP,
    withoutLogicalProperties,
    withoutPhysicalProperties,
    ...swcOptions
  } = options;
  const propertyPolicy = resolvePropertyPolicy({
    withoutLogicalProperties,
    withoutPhysicalProperties,
  });
  const swc = swcJest.createTransformer(swcOptions) as Required<
    Pick<SwcTransformer, 'process' | 'processAsync' | 'getCacheKey'>
  > &
    SwcTransformer;
  const compiled = new Map<string, { src: string; code: string }>();

  const compile = (src: string, filename: string, jestOptions: JestOptions) => {
    if (
      filename.includes('node_modules') ||
      !needsCompile(src, styleProp, filename)
    ) {
      return src;
    }
    return transformSource({
      source: src,
      moduleId: filename,
      filePath: filename,
      root: jestOptions.config.rootDir,
      styleProp,
      propertyPolicy,
      isDev: process.env.NODE_ENV !== 'production',
      collectOndemandSheets: false,
    }).code;
  };

  const take = (src: string, filename: string, jestOptions: JestOptions) => {
    const cached = compiled.get(filename);
    compiled.delete(filename);
    return cached && cached.src === src
      ? cached.code
      : compile(src, filename, jestOptions);
  };

  return {
    canInstrument: swc.canInstrument,
    process(...[src, filename, jestOptions]: Parameters<typeof swc.process>) {
      return swc.process(
        take(src, filename, jestOptions),
        filename,
        jestOptions,
      );
    },
    processAsync(
      ...[src, filename, jestOptions]: Parameters<typeof swc.processAsync>
    ) {
      return swc.processAsync(
        take(src, filename, jestOptions),
        filename,
        jestOptions,
      );
    },
    getCacheKey(
      ...[src, filename, jestOptions]: Parameters<typeof swc.getCacheKey>
    ) {
      const code = compile(src, filename, jestOptions);
      compiled.set(filename, { src, code });
      return swc.getCacheKey(code, filename, jestOptions);
    },
  };
}

export default { createTransformer };
