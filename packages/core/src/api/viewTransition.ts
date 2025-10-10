import type { CSSProperties, ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (object: ViewTransitionOptions): string => {
  const hash = genBase36Hash(object, 1, 8);
  const transitionId = `vt-${hash}`;

  global({
    [`::view-transition-group(${transitionId})`]: object.group as CSSProperties,
    [`::view-transition-image-pair(${transitionId})`]:
      object.imagePair as CSSProperties,
    [`::view-transition-old(${transitionId})`]: object.old as CSSProperties,
    [`::view-transition-new(${transitionId})`]: object.new as CSSProperties,
  });

  return transitionId;
};

export { viewTransition };
