import type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  ReturnType,
} from 'zss-engine';
import {
  overrideLonghand,
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
} from 'zss-engine';

const styleAtomMap = new WeakMap<
  CSSProperties,
  Array<{
    key: string;
    hash: string;
    sheet: string;
  }>
>();

function create<const T extends Record<string, CSSProperties>>(
  rule: CreateStyleType<T>,
): ReturnType<T> {
  const result = {} as ReturnType<T>;

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
            querySheets.push(sheet.replace(`.${hash}`, `.${hash}:not(#\\#)`));
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
            `.${nonFlatHash}:not(#\\#)`,
          );

          records.push({
            key: atRule + selector,
            hash: nonFlatHash,
            sheet: finalSheet,
          });
        });
      });
    }

    styleAtomMap.set(styleRule, records);

    Object.defineProperty(result, key, {
      get: () => Object.freeze(styleRule),
    });
  });

  return Object.freeze(result);
}

export { create, styleAtomMap };
