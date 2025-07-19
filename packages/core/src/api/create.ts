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

    Object.entries(flat).forEach(([prop, val]) => {
      const hashes = new Set<string>();
      const sheets = new Set<string>();
      processAtomicProps({ [prop]: val }, hashes, sheets);

      const hash = hashes.values().next().value as string;
      const sheet = sheets.values().next().value as string;

      records.push({
        key: prop,
        hash,
        sheet,
      });
    });

    if (Object.keys(nonFlat).length > 0) {
      const nonFlatObj = { [key]: nonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        Object.entries(nestedObj as Record<string, unknown>).forEach(
          ([prop]) => {
            // Only key is converted to atom by atRule+prop
            const recordKey = `${atRule}|${prop}`;
            records.push({
              key: recordKey,
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
