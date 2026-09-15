import * as css from '@plumeria/core';

export const cascadeBase = css.create({
  box: {
    padding: 4,
  },
  edge: {
    paddingTop: 4,
  },
  text: {
    ':hover': {
      color: 'red',
    },
  },
});
