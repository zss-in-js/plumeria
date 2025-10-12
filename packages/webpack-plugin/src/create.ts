import type {
  CSSProperties,
  CreateStyleType,
  CreateTokens,
  CreateValues,
  ReturnType,
} from 'zss-engine';
import {
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
  camelToKebabCase,
} from 'zss-engine';

function compileToSingleCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
  const baseSheets: string[] = [];
  const querySheets: string[] = [];
  const processedHashes = new Set<string>(); // For duplicate check

  Object.entries(object).forEach(([key, styleObj]) => {
    const flat: Record<string, any> = {};
    const nonFlat: Record<string, any> = {};
    splitAtomicAndNested(styleObj, flat, nonFlat);

    const records: Array<{
      key: string;
      hash: string;
      sheet: string;
    }> = [];

    // Processing flat atoms and atoms in media
    Object.entries(flat).forEach(([prop, value]) => {
      const hashes = new Set<string>();
      const sheets = new Set<string>();
      const seen = new Set<string>();
      const resultQueue: Array<[string, string | number]> = [];

      processAtomicProps({ [prop]: value }, hashes, sheets, seen, resultQueue);

      // Organize media and containers by sheet
      const propBaseSheets: string[] = [];
      const propQuerySheets: string[] = [];

      for (const sheet of sheets) {
        if (sheet.includes('@media') || sheet.includes('@container')) {
          propQuerySheets.push(sheet);
        } else {
          propBaseSheets.push(sheet);
        }
      }

      const hash = [...hashes].join(' ');
      const sheet = [...propBaseSheets, ...propQuerySheets].join('');

      records.push({
        key: prop,
        hash,
        sheet,
      });
    });

    // Handling nested objects such as pseudos to atom by key is atRule + prop
    if (Object.keys(nonFlat).length > 0) {
      const nonFlatObj = { [key]: nonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        Object.entries(nestedObj as Record<string, unknown>).forEach(
          ([prop]) => {
            records.push({
              key: atRule + prop,
              hash: nonFlatHash,
              sheet: styleSheet,
            });
          },
        );
      });
    }

    // Collect sheets from records and avoid duplicates
    records.forEach(({ hash, sheet }) => {
      if (!processedHashes.has(hash)) {
        processedHashes.add(hash);

        if (sheet.includes('@media') || sheet.includes('@container')) {
          querySheets.push(sheet);
        } else {
          baseSheets.push(sheet);
        }
      }
    });
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

const createTokens = <const T extends CreateTokens>(object: T) => {
  const styles: Record<string, Record<string, string | number | object>> = {};

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    Object.entries(value).forEach(([subKey, subValue]) => {
      if (subKey.startsWith('@media')) {
        styles[':root'] ||= {};
        styles[':root'][subKey] ||= {};
        (styles[':root'][subKey] as Record<string, string | number>)[
          `--${kebabKey}`
        ] = subValue;
      } else {
        const themeSelector =
          subKey === 'default' ? ':root' : `:root[data-theme="${subKey}"]`;
        styles[themeSelector] ||= {};
        styles[themeSelector][`--${kebabKey}`] = subValue;
      }
    });
  });

  return styles;
};

export { createCSS, createVars, createTokens };
