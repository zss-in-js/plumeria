import type { CustomHTMLType, VarsDefinition } from 'zss-engine';
import { isDevAndTest, isServer, injectServerCSS, injectClientGlobalCSS, transpiler, genBase36Hash } from 'zss-engine';
import { resolvePromise, globalPromise, initPromise } from './global-build-helper.js';

export function global(object: CustomHTMLType | VarsDefinition): void {
  const base36Hash = genBase36Hash(object, 8);
  const { styleSheet } = transpiler(object, undefined, '--global');
  if (typeof globalPromise === 'undefined') initPromise();
  resolvePromise([styleSheet, '--global']);

  if (isDevAndTest) isServer ? injectServerCSS(base36Hash, styleSheet) : injectClientGlobalCSS(styleSheet, 'global');
}
