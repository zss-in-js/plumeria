import type { ReturnType, CreateStyle, CustomProperties } from 'zss-engine';
import { isDevAndTest, transpiler, genBase36Hash, isServer, injectServerCSS, injectClientCSS } from 'zss-engine';
import { initPromise, globalPromise, resolvePromise } from './create-build-helper.js';

export function create<T extends Record<string, CustomProperties>>(object: CreateStyle<T>): ReturnType<T> {
  const base36Hash = genBase36Hash(object, 6);
  const { styleSheet } = transpiler(object, base36Hash);
  const injectCSS = isServer ? injectServerCSS : injectClientCSS;
  if (typeof globalPromise === 'undefined') initPromise();
  resolvePromise(styleSheet);

  Object.keys(object).forEach(key => {
    Object.defineProperty(object, key, {
      get: () => {
        const className = key + '_' + base36Hash;
        if (isDevAndTest) injectCSS(base36Hash, styleSheet);
        return className;
      },
    });
  });

  return Object.freeze(object as unknown as ReturnType<T>);
}
