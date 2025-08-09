import type {
  CSSProperties,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  ReturnType,
} from 'zss-engine';
import {
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
} from 'zss-engine';

function compileToSingleCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
  const baseSheets: string[] = [];
  const querySheets: string[] = [];
  const atomicHashes = new Set<string>();

  Object.entries(object).forEach(([key, styleObj]) => {
    const flat: Record<string, any> = {};
    const nonFlat: Record<string, any> = {};
    splitAtomicAndNested(styleObj, flat, nonFlat);

    if (Object.keys(flat).length > 0) {
      const sheets = new Set<string>();
      processAtomicProps(flat, atomicHashes, sheets);

      for (const sheet of sheets) {
        if (sheet.includes('@media') || sheet.includes('@container')) {
          querySheets.push(sheet);
        } else {
          baseSheets.push(sheet);
        }
      }
    }

    if (Object.keys(nonFlat).length > 0) {
      const nonFlatHash = genBase36Hash({ [key]: nonFlat }, 1, 7);
      const { styleSheet } = transpile({ [key]: nonFlat }, nonFlatHash);
      baseSheets.push(styleSheet);
    }
  });

  return [...baseSheets, ...querySheets].join('\n');
}

function createCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
  const result = {} as ReturnType<T>;

  Object.entries(object).forEach(([key, styleObj]) => {
    Object.defineProperty(result, key, {
      get: () => Object.freeze(styleObj),
    });
  });

  const compiledCSS = compileToSingleCSS(object);

  return compiledCSS;
}

const createVars = <const T extends CreateValues>(object: T) => {
  const styles: Record<string, CreateValues> = {
    ':root': {},
  };

  Object.entries(object).forEach(([key, value]) => {
    styles[':root'][`--${key}`] = value;
  });

  styles;
  return styles;
};

const createTheme = <const T extends CreateTheme>(object: T) => {
  const styles: Record<string, Record<string, string | number | object>> = {};

  Object.entries(object).forEach(([key, value]) => {
    Object.entries(value).forEach(([subKey, subValue]) => {
      if (subKey.startsWith('@media')) {
        styles[':root'] ||= {};
        styles[':root'][subKey] ||= {};
        (styles[':root'][subKey] as Record<string, string | number>)[
          `--${key}`
        ] = subValue;
      } else {
        const themeSelector =
          subKey === 'default' ? ':root' : `:root[data-theme="${subKey}"]`;
        styles[themeSelector] ||= {};
        styles[themeSelector][`--${key}`] = subValue;
      }
    });
  });

  return styles;
};

export { createCSS, createVars, createTheme };
