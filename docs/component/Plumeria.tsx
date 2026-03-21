import * as style from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

const styles = style.create({
  headings: {
    position: 'relative',
    bottom: 12,
    left: -4,
    zIndex: 0,
    display: 'block',
    fontSize: 56,
    fontWeight: 600,
    lineHeight: 1.1,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundClip: 'text',
    [breakpoints.md]: {
      bottom: 4,
      fontSize: 32,
    },
  },
});

export const Plumeria = () => {
  return <div className={style.use(styles.headings)}>Plumeria</div>;
};
