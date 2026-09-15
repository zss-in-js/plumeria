import * as css from '@plumeria/core';

export const queryWide = css.create({
  box: {
    '@media (min-width: 900px)': {
      color: 'blue',
    },
  },
});
