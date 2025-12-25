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
  rule: CreateStyleType<T>,
): string {
  const baseSheets: string[] = [];
  const querySheets: string[] = [];
  const processedHashes = new Set<string>();

  Object.entries(rule).forEach(([key, styleRule]) => {
    const flat: CreateStyle = {};
    const nonFlat: CreateStyle = {};

    splitAtomicAndNested(styleRule, flat, nonFlat);
    const finalFlat = overrideLonghand(flat);

    const records: Array<{
      key: string;
      hash: string;
      sheet: string;
    }> = [];

    Object.entries(finalFlat).forEach(([prop, value]) => {
      if (prop.startsWith('@media') || prop.startsWith('@container')) {
        Object.entries(value).forEach(([innerProp, innerValue]) => {
          const atomicMap = new Map<string, string>();

          processAtomicProps({ [innerProp]: innerValue }, atomicMap, prop);

          const querySheets: string[] = [];
          const queryHashes: string[] = [];

          for (const [hash, sheet] of atomicMap) {
            querySheets.push(
              sheet.replace(`.${hash}`, `.${hash}:not(#\\#):not(#\\#)`),
            );
            queryHashes.push(hash);
          }

          if (querySheets.length > 0) {
            records.push({
              key: prop + innerProp,
              hash: queryHashes.join(' '),
              sheet: querySheets.join(''),
            });
          }
        });
      } else {
        const atomicMap = new Map<string, string>();

        processAtomicProps({ [prop]: value }, atomicMap);

        const sheets: string[] = [];
        const hashes: string[] = [];

        for (const [hash, sheet] of atomicMap) {
          sheets.push(sheet);
          hashes.push(hash);
        }

        if (sheets.length > 0) {
          records.push({
            key: prop,
            hash: hashes.join(' '),
            sheet: sheets.join(''),
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

      Object.entries(nonFlatBase).forEach(([selector, style]) => {
        const nonFlatObj = { [key]: { [selector]: style } };
        const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
        const { styleSheet } = transpile(nonFlatObj, nonFlatHash);

        records.push({
          key: selector,
          hash: nonFlatHash,
          sheet: styleSheet,
        });
      });

      Object.entries(nonFlatQuery).forEach(([atRule, nestedStyles]) => {
        Object.entries(nestedStyles).forEach(([selector, style]) => {
          const nonFlatObj = {
            [key]: { [atRule]: { [selector]: style } },
          };
          const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
          const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
          const finalSheet = styleSheet.replace(
            `.${nonFlatHash}`,
            `.${nonFlatHash}:not(#\\#):not(#\\#)`,
          );

          records.push({
            key: atRule + selector,
            hash: nonFlatHash,
            sheet: finalSheet,
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
  rule: CreateStyleType<T>,
): string {
  const compiledCSS = compileToSingleCSS(rule);
  return compiledCSS;
}

const createVars = <const T extends CreateValues>(rule: T) => {
  const styles: Record<string, CreateValues> = {
    ':root': {},
  };

  Object.entries(rule).forEach(([key, value]) => {
    styles[':root'][`--${key}`] = value;
  });

  return styles;
};

const createTheme = <const T extends CreateTheme>(rule: T) => {
  const styles: Record<
    string,
    Record<string, string | number | Record<string, string | number>>
  > = {};
  for (const key in rule) {
    const varKey = `--${camelToKebabCase(key)}`;

    const themeMap = rule[key];
    for (const themeKey in themeMap) {
      const value = themeMap[themeKey];

      const isQuery =
        themeKey.startsWith('@media') || themeKey.startsWith('@container');

      const selector =
        isQuery || themeKey === 'default'
          ? ':root'
          : `:root[data-theme="${themeKey}"]`;

      const target = (styles[selector] ||= {});

      if (isQuery) {
        const queryObj = (target[themeKey] ||= {}) as Record<
          string,
          string | number
        >;
        queryObj[varKey] = value;
      } else {
        target[varKey] = value;
      }
    }
  }

  return styles;
};

export { createCSS, createVars, createTheme };
