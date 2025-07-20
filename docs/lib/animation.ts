import { css } from '@plumeria/core'

export const rotateHover = css.keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

export const rotateFocus = css.keyframes({
  from: {
    transform: 'rotateY(0deg) rotateX(0deg)',
  },
  to: {
    transform: 'rotateY(360deg) rotateX(90deg)',
  },
});