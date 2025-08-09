import type { CreateKeyframes } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const keyframes = (object: CreateKeyframes): string => {
  const hash = genBase36Hash(object, 1, 8);
  global({ [`@keyframes ${hash}`]: object });
  return hash;
};

export { keyframes };
