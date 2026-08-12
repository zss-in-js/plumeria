import * as css from '@plumeria/core';

export const cascadeBase = css.create({
  box: {
    paddingTop: 4,
  },
  text: {
    ':hover': {
      color: 'red',
    },
  },
});
