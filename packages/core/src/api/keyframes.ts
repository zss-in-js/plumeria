import type { CreateKeyframes } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const keyframes = (rule: CreateKeyframes): string => {
  const hash = genBase36Hash(rule, 1, 8);
  const ident = `kf-${hash}`;
  global({ [`@keyframes ${ident}`]: rule });
  return ident;
};

export { keyframes };
