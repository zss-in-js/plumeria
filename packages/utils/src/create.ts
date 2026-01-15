import {
  CSSProperties,
  CreateStyle,
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
  overrideLonghand,
  transpileAtomic,
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
        const queryKey = prop + ':' + innerProp;
        if (querySheets.length > 0) {
          records.push({
            key: queryKey,
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

    const processSelectorStyle = (
      selector: string,
      style: CSSProperties,
      atRule?: string,
      index?: number,
    ) => {
      const isAtomic =
        selector.startsWith(':') ||
        (selector.startsWith('&') &&
          (selector.startsWith('&:') || selector.startsWith('&[')));

      if (isAtomic) {
        const normalizedSelector = selector.replace('&', '');
        Object.entries(style).forEach(([prop, value]) => {
          let hashSource = { [prop]: value };
          if (atRule) {
            hashSource = { [atRule]: { [selector]: hashSource } };
          } else {
            hashSource = { [selector]: hashSource };
          }

          const suffix = atRule ? notNormalize : ':not(#\\#)';
          const hash = genBase36Hash(hashSource, 1, 8);

          let sheet = transpileAtomic(
            prop,
            value as string | number,
            hash,
            normalizedSelector,
          );

          sheet = sheet.replace(`.${hash}`, `.${hash}${suffix}`);

          if (atRule) {
            sheet = `${atRule} { ${sheet} }`;
          }

          records.push({
            key: atRule
              ? `${atRule}:${selector}:${prop}`
              : `${selector}:${prop}`,
            hash,
            sheet: sheet + '\n',
          });
        });
      } else {
        const hashObj = {
          [key]: { [atRule || 'base']: { [selector]: style, index } },
        };

        const hash = genBase36Hash(hashObj, 1, 7);

        const transpileObj = atRule
          ? { [key]: { [atRule]: { [selector]: style } } }
          : { [key]: { [selector]: style } };

        const { styleSheet } = transpile(transpileObj, hash);

        const sheet = atRule
          ? styleSheet.replace(`.${hash}`, `.${hash}${notNormalize}`)
          : styleSheet;

        const recordKey = atRule
          ? `${atRule}:${selector}:${index}`
          : `${selector}:${index}`;

        records.push({
          key: recordKey,
          hash: hash,
          sheet: sheet,
        });
      }
    };

    Object.entries(nonFlatBase).forEach(([selector, style], index) => {
      processSelectorStyle(selector, style as CSSProperties, undefined, index);
    });

    Object.entries(nonFlatQuery).forEach(([atRule, nestedStyles]) => {
      Object.entries(nestedStyles).forEach(([selector, style], index) => {
        processSelectorStyle(selector, style as CSSProperties, atRule, index);
      });
    });
  }

  return records;
}
