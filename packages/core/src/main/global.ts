import type { CSSHTML } from 'zss-engine';
import {
  transpiler,
  isServer,
  isTestingDevelopment,
  injectServerCSS,
  injectClientGlobalCSS,
  genBase36Hash,
} from 'zss-engine';
import {
  initPromise_2,
  globalPromise_2,
  resolvePromise_2,
} from '../processors/css';

function global(object: CSSHTML): void {
  const base36Hash = genBase36Hash(object, 8);
  const { styleSheet } = transpiler(object, undefined, '--global');
  if (typeof globalPromise_2 === 'undefined') initPromise_2();
  resolvePromise_2(styleSheet);

  if (isTestingDevelopment)
    isServer
      ? injectServerCSS(base36Hash, styleSheet)
      : injectClientGlobalCSS(styleSheet);
}

export default global;
