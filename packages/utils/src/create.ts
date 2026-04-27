import {
  CSSProperties,
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  overrideLonghand,
  transpileAtomic,
} from 'zss-engine';

export interface StyleRecord {
  key: string;
  hash: string;
  sheet: string;
}

export function getStyleRecords(styleRule: CSSProperties): StyleRecord[] {
  const flat: CSSProperties = {};
  const nonFlat: CSSProperties = {};
  const notNormalize = ':not(#\\#)';

  splitAtomicAndNested(styleRule, flat, nonFlat);
  const finalFlat = overrideLonghand(flat);

  const records: StyleRecord[] = [];

  Object.entries(finalFlat).forEach(([prop, value]) => {
    if (prop.startsWith('@media') || prop.startsWith('@container')) {
      Object.entries(value).forEach(([innerProp, innerValue]) => {
        const atomicMap = new Map<string, string>();
        const notSuffix = innerProp.startsWith('--') ? '' : notNormalize;

        processAtomicProps({ [innerProp]: innerValue }, atomicMap, prop);

        const querySheets: string[] = [];
        const queryHashes: string[] = [];

        for (const [hash, sheet] of atomicMap) {
          querySheets.push(sheet.replace(`.${hash}`, `.${hash}${notSuffix}`));
          queryHashes.push(hash);
        }
        const queryKey = prop + ':' + innerProp;

        records.push({
          key: queryKey,
          hash: queryHashes.join(' '),
          sheet: querySheets.join(''),
        });
      });
    } else if (typeof value === 'string' || typeof value === 'number') {
      const atomicMap = new Map<string, string>();

      processAtomicProps({ [prop]: value }, atomicMap);

      const sheets: string[] = [];
      const hashes: string[] = [];

      for (const [hash, sheet] of atomicMap) {
        sheets.push(sheet);
        hashes.push(hash);
      }

      records.push({
        key: prop,
        hash: hashes.join(' '),
        sheet: sheets.join(''),
      });
    }
  });

  if (Object.keys(nonFlat).length > 0) {
    const nonFlatBase: Record<string, CSSProperties> = {};
    const nonFlatQuery: Record<string, CSSProperties> = {};

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
    ) => {
      Object.entries(style).forEach(([prop, value]) => {
        let hashSource = { [prop]: value };
        if (atRule) {
          hashSource = {
            [atRule]: {
              [selector]: hashSource,
            },
          };
        } else {
          hashSource = { [selector]: hashSource };
        }

        const hash = genBase36Hash(hashSource, 1, 8);
        const notSuffix = prop.startsWith('--') ? '' : notNormalize;

        let sheet = transpileAtomic(
          prop,
          value as string | number,
          hash,
          selector,
        );

        sheet = sheet.replace(`.${hash}`, `.${hash}${notSuffix}`);

        if (atRule) {
          sheet = `${atRule} { ${sheet} }`;
        }

        records.push({
          key: atRule ? `${atRule}:${selector}:${prop}` : `${selector}:${prop}`,
          hash,
          sheet: sheet + '\n',
        });
      });
    };

    Object.entries(nonFlatBase).forEach(([selector, style]) => {
      processSelectorStyle(selector, style, undefined);
    });

    Object.entries(nonFlatQuery).forEach(([atRule, nestedStyles]) => {
      Object.entries(nestedStyles).forEach(([selector, style]) => {
        processSelectorStyle(selector, style as CSSProperties, atRule);
      });
    });
  }

  return records;
}
