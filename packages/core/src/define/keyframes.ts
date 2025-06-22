import type { CreateKeyframes } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { default as global } from '../main/global';

const keyframes = (object: CreateKeyframes): string => {
  const prefix = genBase36Hash(object, 8);
  global({ [`@keyframes ${prefix}`]: object });
  return prefix;
};

export default keyframes;
