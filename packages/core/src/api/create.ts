import type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  ReturnType,
} from 'zss-engine';
import {
  SHORTHAND_PROPERTIES,
  LONG_TO_SHORT,
  camelToKebabCase,
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

    const overrideLonghand = (style: CreateStyle) => {
      const props = Object.keys(style);
      const propsToRemove = new Set<string>();

      // Find plain props and their indices
      const plainProps: { key: string; index: number }[] = [];
      for (let i = 0; i < props.length; i++) {
        if (!props[i].startsWith('@')) {
          plainProps.push({ key: props[i], index: i });
        }
      }

      // Find shorthands among plain props
      const shorthandsInStyle: { [key: string]: number } = {};
      for (const { key, index } of plainProps) {
        const kebab = camelToKebabCase(key);
        if (SHORTHAND_PROPERTIES[kebab]) {
          shorthandsInStyle[kebab] = index;
        }
      }

      // Determine which longhands to remove
      for (const { key, index } of plainProps) {
        const kebab = camelToKebabCase(key);
        if (!SHORTHAND_PROPERTIES[kebab]) {
          // is longhand
          const longhands = LONG_TO_SHORT[kebab] || [];
          for (const shorthand of longhands) {
            if (shorthandsInStyle[shorthand] > index) {
              propsToRemove.add(key);
              break;
            }
          }
        }
      }

      const finalStyle: CreateStyle = {};
      for (const prop of props) {
        if (propsToRemove.has(prop)) {
          continue;
        }
        if (prop.startsWith('@')) {
          finalStyle[prop] = overrideLonghand(style[prop] as CreateStyle);
        } else {
          finalStyle[prop] = style[prop];
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

    // Handling nested objects such as pseudos to atom by key is atRule + prop
    if (Object.keys(nonFlat).length > 0) {
      const nonFlatObj = { [key]: nonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      Object.entries(nonFlat).forEach(([atRule, nestedObj]) => {
        Object.keys(nestedObj).forEach((prop) => {
          records.push({
            key: atRule + prop,
            hash: nonFlatHash,
            sheet: styleSheet,
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
