import type { CSSProperties, CreateStyleType, ReturnType } from 'zss-engine';
import {
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
          sheet: baseSheetParts.join(' '),
        });
      }

      if (querySheetParts.length > 0) {
        records.push({
          key: prop + '__queries__',
          hash: queryHashParts.join(' '),
          sheet: querySheetParts.join(' '),
        });
      }
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

    styleAtomMap.set(styleObj, records);

    Object.defineProperty(result, key, {
      get: () => Object.freeze(styleObj),
    });
  });

  return Object.freeze(result) as ReturnType<T>;
}

export { create, styleAtomMap };
