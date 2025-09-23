import type { ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (object: ViewTransitionOptions): string => {
  const hash = genBase36Hash(object, 1, 8);
  const transitionName = `vt-${hash}`;

  global({
    [`::view-transition-old(${transitionName})`]: object.old,
    [`::view-transition-new(${transitionName})`]: object.new,
  });

  return transitionName;
};

export { viewTransition };
