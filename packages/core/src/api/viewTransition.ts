import type { CSSProperties, ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (object: ViewTransitionOptions): string => {
  const hash = genBase36Hash(object, 1, 8);
  const transitionName = `vt-${hash}`;

  global({
    [`::view-transition-group(${transitionName})`]:
      object.group as CSSProperties,
    [`::view-transition-image-pair(${transitionName})`]:
      object.imagePair as CSSProperties,
    [`::view-transition-old(${transitionName})`]: object.old as CSSProperties,
    [`::view-transition-new(${transitionName})`]: object.new as CSSProperties,
  });

  return transitionName;
};

export { viewTransition };
