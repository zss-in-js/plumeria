import type { CSSProperties, ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (object: ViewTransitionOptions): string => {
  const hash = genBase36Hash(object, 1, 8);
  const name = `vt-${hash}`;

  global({
    [`::view-transition-group(${name})`]: object.group as CSSProperties,
    [`::view-transition-image-pair(${name})`]:
      object.imagePair as CSSProperties,
    [`::view-transition-old(${name})`]: object.old as CSSProperties,
    [`::view-transition-new(${name})`]: object.new as CSSProperties,
  });

  return name;
};

export { viewTransition };
