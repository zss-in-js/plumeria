import type { CSSProperties, CreateStyleType, ReturnType } from 'zss-engine';
import {
  transpiler,
  isServer,
  isTestingDevelopment,
  injectServerCSS,
  injectClientCSS,
  genBase36Hash,
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
  const base36Hash = genBase36Hash(object, 6);
  const { styleSheet } = transpiler(object, base36Hash);
  const injectCSS = isServer ? injectServerCSS : injectClientCSS;
  if (typeof globalPromise_1 === 'undefined') initPromise_1();
  resolvePromise_1(styleSheet);

  Object.keys(object).forEach((key) => {
    const cssProperties = object[key];
    const hashedClassName = key + '_' + base36Hash;
    objectToKeyHashMap.set(cssProperties, hashedClassName);
    Object.defineProperty(object, key, {
      get: () => {
        if (isTestingDevelopment) injectCSS(base36Hash, styleSheet);
        return Object.freeze(cssProperties);
      },
    });
  });

  return Object.freeze(object as ReturnType<T>);
}

export { create, objectToKeyHashMap };
