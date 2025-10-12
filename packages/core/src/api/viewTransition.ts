import type { CSSProperties, ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (object: ViewTransitionOptions): string => {
  const hash = genBase36Hash(object, 1, 8);
  const ident = `vt-${hash}`;

  global({
    [`::view-transition-group(${ident})`]: object.group as CSSProperties,
    [`::view-transition-image-pair(${ident})`]:
      object.imagePair as CSSProperties,
    [`::view-transition-old(${ident})`]: object.old as CSSProperties,
    [`::view-transition-new(${ident})`]: object.new as CSSProperties,
  });

  return ident;
};

export { viewTransition };
