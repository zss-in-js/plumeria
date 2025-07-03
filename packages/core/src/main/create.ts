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
function create<const T extends Record<string, CSSProperties>>(
  object: CreateStyleType<T>,
): ReturnType<T> {
  const result = {};

  Object.keys(object).forEach((key) => {
    const cssProperties = object[key];
    const atomicHashes: string[] = [];
    const allStyleSheets: string[] = [];

    const flat: CreateStyle = {};
    const nonFlat: CreateStyle = {};
    splitAtomicAndNested(cssProperties, flat, nonFlat);

    // flat atomics process
    processAtomicProps(flat, undefined, atomicHashes, allStyleSheets);

    // non flat process
    if (Object.keys(nonFlat).length > 0) {
      // Pass the top key
      const nonFlatObj = { [key]: nonFlat };
      const nonFlatHash = genBase36Hash(nonFlatObj, 1, 7);
      atomicHashes.push(nonFlatHash);

      const { styleSheet } = transpile(nonFlatObj, nonFlatHash);
      allStyleSheets.push(styleSheet);
    }

    const injectIfNeeded = isServer ? injectServerCSS : injectClientCSS;

    if (typeof globalPromise_1 === 'undefined') initPromise_1();
    resolvePromise_1(allStyleSheets.join('\n'));

    const combinedClassName = atomicHashes.join(' ');
    objectToKeyHashMap.set(cssProperties, combinedClassName);

    if (isTestingDevelopment) {
      injectIfNeeded(combinedClassName, allStyleSheets.join('\n'));
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
