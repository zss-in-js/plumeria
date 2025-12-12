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
  object: CreateStyleType<T>,
): ReturnType<T> {
  const result = {} as ReturnType<T>;

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
          querySheetParts.push(sheet.replace(`.${hash}`, `.${hash}:not(#\\#)`));
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
          ? styleSheet.replace(`.${nonFlatHash}`, `.${nonFlatHash}:not(#\\#)`)
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

    styleAtomMap.set(styleObj, records);

    Object.defineProperty(result, key, {
      get: () => Object.freeze(styleObj),
    });
  });

  return Object.freeze(result) as ReturnType<T>;
}

export { create, styleAtomMap };
