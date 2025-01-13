import { KeyframesDefinition, genBase36Hash } from 'zss-engine';
import { global } from './global';

export const keyframes = (object: KeyframesDefinition) => {
  const prefix = genBase36Hash(object, 8);
  global({ [`@keyframes ${prefix}`]: object });
  return prefix;
};
