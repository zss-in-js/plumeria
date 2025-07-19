import type { CreateKeyframes } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const keyframes = (object: CreateKeyframes): string => {
  const prefix = genBase36Hash(object, 1, 8);
  global({ [`@keyframes ${prefix}`]: object });
  return prefix;
};

export { keyframes };
