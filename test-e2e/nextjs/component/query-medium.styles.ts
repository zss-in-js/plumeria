import * as css from '@plumeria/core';

export const queryMedium = css.create({
  box: {
    '@media (min-width: 600px)': {
      color: 'red',
    },
  },
});
