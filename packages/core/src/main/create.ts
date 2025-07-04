import type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  ReturnType,
} from 'zss-engine';
import {
  transpile,
  isServer,
  isTestingDevelopment,
  injectServerCSS,
  injectClientCSS,
  genBase36Hash,
  splitAtomicAndNested,
  processAtomicProps,
} from 'zss-engine';
import {
  initPromise_1,
  globalPromise_1,
  resolvePromise_1,
} from '../processors/css';

const objectToKeyHashMap = new WeakMap<CSSProperties, string>();
const injectedStyleSheets = new Set<string>();

function create<const T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): ReturnType<T> {
  const result = {};

  Object.keys(object).forEach((key) => {
    const cssProperties = object[key];
    const atomicHashes = new Set<string>();
    const allStyleSheets = new Set<string>();

    const flat: CreateStyle = {};
    const nonFlat: CreateStyle = {};
    splitAtomicAndNested(cssProperties, flat, nonFlat);

    // flat atomics process
    processAtomicProps(flat, atomicHashes, allStyleSheets);

    // non flat process
    if (Object.keys(nonFlat).length > 0) {
      // Pass the top key
      const nonFlatObj = { [key]: nonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      atomicHashes.add(nonFlatHash);

      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      allStyleSheets.add(styleSheet);
    }

    const injectIfNeeded = isServer ? injectServerCSS : injectClientCSS;

    if (typeof globalPromise_1 === 'undefined') initPromise_1();
    resolvePromise_1([...allStyleSheets].join('\n'));

    // Extract only non-duplicate styleSheets
    const uniqueStyleSheets = [...allStyleSheets].filter(
      (sheet) => !injectedStyleSheets.has(sheet),
    );

    // Add the new styleSheets to injectedStyleSheets.
    uniqueStyleSheets.forEach((sheet) => injectedStyleSheets.add(sheet));

    const combinedClassName = [...atomicHashes].join(' ');
    objectToKeyHashMap.set(cssProperties, combinedClassName);

    if (isTestingDevelopment) {
      // Inject only deduplicated styleSheets
      if (uniqueStyleSheets.length > 0) {
        injectIfNeeded(combinedClassName, uniqueStyleSheets.join('\n'));
      }
    }

    Object.defineProperty(result, key, {
      get: () => {
        return Object.freeze(cssProperties);
      },
    });

    Object.defineProperty(result, '$' + key, {
      get: () => {
        return combinedClassName;
      },
    });
  });

  return Object.freeze(result) as ReturnType<T>;
}

export { create, objectToKeyHashMap };
