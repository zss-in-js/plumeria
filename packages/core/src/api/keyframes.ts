import type { CreateKeyframes } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const keyframes = (object: CreateKeyframes): string => {
  const hash = genBase36Hash(object, 1, 8);
  const ident = `kf-${hash}`;
  global({ [`@keyframes ${ident}`]: object });
  return ident;
};

export { keyframes };
