import { css } from '@plumeria/core';

export const rotateHover = css.keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
    scale: 1.2,
    opacity: 0,
  },
});

export const rotateFocus = css.keyframes({
  from: { scale: 1 },
  to: {
    scale: 1.2,
    opacity: 0,
  },
});
