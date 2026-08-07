import * as css from '@plumeria/core';

export const styles = css.create({
  base: {
    fontSize: 12,
  },
  card: {
    ...css.marker('card', ':defined'),
    padding: 16,
    background: 'navy',
    ':hover': {
      background: 'teal',
    },
    '@media (min-width: 600px)': {
      padding: 24,
    },
  },
  cardTitle: {
    color: 'gray',
    [css.extended('card', ':defined')]: {
      color: 'red',
    },
  },
  badge: {
    [css.extended('card', ':defined')]: {
      color: 'lime',
    },
  },
});
