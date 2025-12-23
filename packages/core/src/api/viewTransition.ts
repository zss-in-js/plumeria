import type { CSSProperties, ViewTransitionOptions } from 'zss-engine';
import { genBase36Hash } from 'zss-engine';
import { global } from './global';

const viewTransition = (rule: ViewTransitionOptions): string => {
  const hash = genBase36Hash(rule, 1, 8);
  const ident = `vt-${hash}`;

  global({
    [`::view-transition-group(${ident})`]: rule.group as CSSProperties,
    [`::view-transition-image-pair(${ident})`]: rule.imagePair as CSSProperties,
    [`::view-transition-old(${ident})`]: rule.old as CSSProperties,
    [`::view-transition-new(${ident})`]: rule.new as CSSProperties,
  });

  return ident;
};

export { viewTransition };
