import type { CSSHTML } from 'zss-engine';
import {
  transpile,
  isServer,
  isTestingDevelopment,
  injectClientGlobalCSS,
} from 'zss-engine';
import {
  initPromise_2,
  globalPromise_2,
  resolvePromise_2,
} from '../processors/css';

function global(object: CSSHTML): void {
  const { styleSheet } = transpile(object, undefined, '--global');

  if (typeof globalPromise_2 === 'undefined') initPromise_2();
  resolvePromise_2(styleSheet);

  if (isTestingDevelopment && !isServer) injectClientGlobalCSS(styleSheet);
}

export { global };
