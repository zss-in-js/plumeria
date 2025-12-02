import type {
  CSSProperties,
  CreateStyleType,
  CreateTokens,
  CreateValues,
  CreateStyle,
} from 'zss-engine';
import {
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
  transformNestedSelectors,
  camelToKebabCase,
  overrideLonghand,
} from 'zss-engine';

function compileToSingleCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
  const baseSheets: string[] = [];
  const querySheets: string[] = [];
  const processedHashes = new Set<string>();

  Object.entries(object).forEach(([key, styleObj]) => {
    const flat: CreateStyle = {};
    const nonFlat: CreateStyle = {};

    splitAtomicAndNested(styleObj, flat, nonFlat);
    const finalFlat = overrideLonghand(flat);

    const records: Array<{
      key: string;
      hash: string;
      sheet: string;
    }> = [];

    Object.entries(finalFlat).forEach(([prop, value]) => {
      const hashes = new Set<string>();
      const sheets = new Set<string>();

      processAtomicProps({ [prop]: value }, hashes, sheets);

      const hashArray = [...hashes];
      const sheetArray = [...sheets];

      const baseSheetParts: string[] = [];
      const baseHashParts: string[] = [];
      const querySheetParts: string[] = [];
      const queryHashParts: string[] = [];

      for (let i = 0; i < sheetArray.length; i++) {
        const sheet = sheetArray[i];
        const hash = hashArray[i];
        if (sheet.includes('@media') || sheet.includes('@container')) {
          querySheetParts.push(sheet);
          queryHashParts.push(hash);
        } else {
          baseSheetParts.push(sheet);
          baseHashParts.push(hash);
        }
      }

      if (baseSheetParts.length > 0) {
        records.push({
          key: prop,
          hash: baseHashParts.join(' '),
          sheet: baseSheetParts.join(''),
        });
      }

      if (querySheetParts.length > 0) {
        records.push({
          key: prop + '__queries__',
          hash: queryHashParts.join(' '),
          sheet: querySheetParts.join(''),
        });
      }
    });

    if (Object.keys(nonFlat).length > 0) {
      const modNonFlat = transformNestedSelectors(nonFlat);
      const nonFlatObj = { [key]: modNonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        Object.keys(nestedObj).forEach((prop) => {
          records.push({
            key: atRule + prop,
            hash: nonFlatHash,
            sheet: styleSheet,
          });
        });
      });
    }

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

  const baseLayer =
    baseSheets.length > 0 ? `@layer base {\n${baseSheets.join('')}}` : '';

  return [baseLayer, ...querySheets].filter(Boolean).join('\n');
}

function createCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
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
