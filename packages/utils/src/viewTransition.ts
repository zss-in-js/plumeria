import type { CSSProperties } from 'zss-engine';
import type { ViewTransition } from './types';

export const createViewTransition = (rule: ViewTransition, hash: string) => ({
  [`::view-transition-group(vt-${hash})`]: rule.group as CSSProperties,
  [`::view-transition-image-pair(vt-${hash})`]: rule.imagePair as CSSProperties,
  [`::view-transition-old(vt-${hash})`]: rule.old as CSSProperties,
  [`::view-transition-new(vt-${hash})`]: rule.new as CSSProperties,
});
