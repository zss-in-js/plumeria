import * as css from '@plumeria/core';

export const slideIn = css.keyframes({
  from: {
    backgroundColor: 'blue',
    translate: '0 0',
  },
  to: {
    backgroundColor: 'green',
    translate: '120px 0',
  },
});

export const keyframesStyle = css.create({
  box: {
    width: 80,
    height: 40,
    backgroundColor: 'blue',
    animationName: slideIn,
    animationDuration: '200ms',
    animationFillMode: 'forwards',
  },
});
