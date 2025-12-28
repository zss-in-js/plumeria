import {
  CSSProperties,
  CreateStyle,
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
  overrideLonghand,
} from 'zss-engine';

export interface StyleRecord {
  key: string;
  hash: string;
  sheet: string;
}

export function getStyleRecords(
  key: string,
  styleRule: CSSProperties,
  priority: number = 1 | 2,
): StyleRecord[] {
  const flat: CreateStyle = {};
  const nonFlat: CreateStyle = {};
  const notNormalize = priority === 1 ? ':not(#\\#)' : ':not(#\\#):not(#\\#)';

  splitAtomicAndNested(styleRule, flat, nonFlat);
  const finalFlat = overrideLonghand(flat);

  const records: StyleRecord[] = [];

  Object.entries(finalFlat).forEach(([prop, value]) => {
    if (prop.startsWith('@media') || prop.startsWith('@container')) {
      Object.entries(value).forEach(([innerProp, innerValue]) => {
        const atomicMap = new Map<string, string>();

        processAtomicProps({ [innerProp]: innerValue }, atomicMap, prop);

        const querySheets: string[] = [];
        const queryHashes: string[] = [];

        for (const [hash, sheet] of atomicMap) {
          querySheets.push(
            sheet.replace(`.${hash}`, `.${hash}${notNormalize}`),
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

    Object.entries(nonFlatBase).forEach(([selector, style], index) => {
      const hashObj = { [key]: { [selector]: style, index } };
      const hash = genBase36Hash(hashObj, 1, 7);

      const transpileObj = { [key]: { [selector]: style } };
      const { styleSheet } = transpile(transpileObj, hash);

      records.push({
        key: selector + index,
        hash: hash,
        sheet: styleSheet,
      });
    });

    Object.entries(nonFlatQuery).forEach(([atRule, nestedStyles]) => {
      Object.entries(nestedStyles as any).forEach(
        ([selector, style], index) => {
          const hashObj = { [key]: { [atRule]: { [selector]: style, index } } };
          const hash = genBase36Hash(hashObj, 1, 7);

          const transpileObj = { [key]: { [atRule]: { [selector]: style } } };
          const { styleSheet } = transpile(transpileObj, hash);

          const finalSheet = styleSheet.replace(
            `.${hash}`,
            `.${hash}${notNormalize}`,
          );

          records.push({
            key: atRule + selector + index,
            hash: hash,
            sheet: finalSheet,
          });
        },
      );
    });
  }

  return records;
}
