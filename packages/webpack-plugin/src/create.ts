import type {
  CSSProperties,
  CreateStyleType,
  CreateTokens,
  CreateValues,
} from 'zss-engine';
import {
  SHORTHAND_PROPERTIES,
  LONG_TO_SHORT,
  splitAtomicAndNested,
  processAtomicProps,
  genBase36Hash,
  transpile,
  camelToKebabCase,
} from 'zss-engine';

function compileToSingleCSS<T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): string {
  const baseSheets: string[] = [];
  const querySheets: string[] = [];
  const processedHashes = new Set<string>(); // For duplicate check

  Object.entries(object).forEach(([key, styleObj]) => {
    const flat: Record<string, any> = {};
    const nonFlat: Record<string, any> = {};

    splitAtomicAndNested(styleObj, flat, nonFlat);

    const overrideLonghand = (style: Record<string, any>) => {
      const props = Object.keys(style);

      if (props.some((p) => p.startsWith('@'))) {
        const finalStyle: Record<string, any> = { ...style };
        for (const key of props) {
          if (key.startsWith('@')) {
            finalStyle[key] = overrideLonghand(style[key] as Record<string, any>);
          }
        }
        return finalStyle;
      }

      const finalStyle: Record<string, any> = {};

      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        const kebab = camelToKebabCase(prop);
        const isShorthand = !!SHORTHAND_PROPERTIES[kebab];

        if (isShorthand) {
          finalStyle[prop] = style[prop];
        } else {
          // isLonghand
          let isOverridden = false;
          const shorthands = LONG_TO_SHORT[kebab] || [];
          for (let j = i + 1; j < props.length; j++) {
            const futureProp = props[j];
            const futureKebab = camelToKebabCase(futureProp);
            if (shorthands.includes(futureKebab)) {
              isOverridden = true;
              break;
            }
          }
          if (!isOverridden) {
            finalStyle[prop] = style[prop];
          }
        }
      }
      return finalStyle;
    };

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

      // Organize media and containers by sheet
      const propBaseSheets: string[] = [];
      const propQuerySheets: string[] = [];

      for (const sheet of sheets) {
        if (sheet.includes('@media') || sheet.includes('@container')) {
          propQuerySheets.push(sheet);
        } else {
          propBaseSheets.push(sheet);
        }
      }

      const hash = [...hashes].join(' ');
      const sheet = [...propBaseSheets, ...propQuerySheets].join('');

      records.push({
        key: prop,
        hash,
        sheet,
      });
    });

    // Handling nested objects such as pseudos to atom by key is atRule + prop
    if (Object.keys(nonFlat).length > 0) {
      const finalNonFlat: Record<string, any> = {};
      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        finalNonFlat[atRule] = overrideLonghand(nestedObj as Record<string, any>);
      });

      const nonFlatObj = { [key]: finalNonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      Object.entries(finalNonFlat).forEach(([atRule, nestedObj]) => {
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

    // Collect sheets from records and avoid duplicates
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

  return [...baseSheets, ...querySheets].join('\n');
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
