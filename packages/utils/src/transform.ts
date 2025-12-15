import type {
  CSSProperties,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateStyle,
} from 'zss-engine';
import {
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
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

    // Processing flat atoms and atoms in media
    Object.entries(finalFlat).forEach(([prop, value]) => {
      // Handle atomic rules inside media queries separately to generate granular keys
      if (
        (prop.startsWith('@media') || prop.startsWith('@container')) &&
        typeof value === 'object' &&
        value !== null
      ) {
        Object.entries(value).forEach(([innerProp, innerValue]) => {
          const atomicMap = new Map<string, string>();

          processAtomicProps({ [innerProp]: innerValue }, atomicMap, prop);

          const querySheetParts: string[] = [];
          const queryHashParts: string[] = [];

          for (const [hash, sheet] of atomicMap) {
            querySheetParts.push(
              sheet.replace(`.${hash}`, `.${hash}:not(#\\#):not(#\\#)`),
            );
            queryHashParts.push(hash);
          }

          if (querySheetParts.length > 0) {
            records.push({
              key: prop + innerProp,
              hash: queryHashParts.join(' '),
              sheet: querySheetParts.join(''),
            });
          }
        });
      } else {
        const atomicMap = new Map<string, string>();

        processAtomicProps({ [prop]: value }, atomicMap);

        const baseSheetParts: string[] = [];
        const baseHashParts: string[] = [];

        for (const [hash, sheet] of atomicMap) {
          baseSheetParts.push(sheet);
          baseHashParts.push(hash);
        }

        if (baseSheetParts.length > 0) {
          records.push({
            key: prop,
            hash: baseHashParts.join(' '),
            sheet: baseSheetParts.join(''),
          });
        }
      }
    });

    if (Object.keys(nonFlat).length > 0) {
      const nonFlatBase: CreateStyle = {};
      const nonFlatQuery: CreateStyle = {};

      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        if (atRule.startsWith('@media') || atRule.startsWith('@container')) {
          nonFlatQuery[atRule] = nestedObj;
        } else {
          nonFlatBase[atRule] = nestedObj;
        }
      });

      [nonFlatBase, nonFlatQuery].forEach((targetNonFlat) => {
        if (Object.keys(targetNonFlat).length === 0) return;

        const nonFlatObj = { [key]: targetNonFlat };
        const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
        const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
        const isQuery =
          styleSheet.includes('@media') || styleSheet.includes('@container');
        const finalSheet = isQuery
          ? styleSheet.replace(
              `.${nonFlatHash}`,
              `.${nonFlatHash}:not(#\\#):not(#\\#)`,
            )
          : styleSheet;

        Object.entries(targetNonFlat).forEach(([atRule, nestedObj]) => {
          Object.keys(nestedObj).forEach((prop) => {
            records.push({
              key: atRule + prop,
              hash: nonFlatHash,
              sheet: finalSheet,
            });
          });
        });
      });
    }

    records.reverse().forEach(({ hash, sheet }) => {
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

  return [...baseSheets, ...querySheets].filter(Boolean).join('');
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

  return styles;
};

const createTheme = <const T extends CreateTheme>(object: T) => {
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

export { createCSS, createVars, createTheme };
