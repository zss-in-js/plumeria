import type { CSSHTML } from 'zss-engine';
import { transpile } from 'zss-engine';
import { gQueue } from '../processors/css';

function global(rule: CSSHTML): void {
  const { styleSheet } = transpile(rule, undefined, '--global');

  if (typeof gQueue.promise === 'undefined') gQueue.init();
  gQueue.resolve(styleSheet);
}

export { global };
