import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

const styles = css.create({
  headings: {
    position: 'relative',
    bottom: 12,
    left: -4,
    zIndex: 0,
    display: 'block',
    fontSize: 52,
    fontWeight: 600,
    lineHeight: 1.1,
    color: 'var(--plume-accent)',
    [breakpoints.md]: {
      fontSize: 32,
    },
  },
});

export const Plumeria = () => {
  return <div className={css.use(styles.headings)}>Plumeria</div>;
};
