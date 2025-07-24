import { css } from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

const styles = css.create({
  headings: {
    position: 'relative',
    left: -4,
    zIndex: 0,
    display: 'inline',
    marginBottom: '12px',
    fontSize: 56,
    fontWeight: 600,
    WebkitTextFillColor: 'transparent',
    textAlign: 'left',
    background: 'linear-gradient(90deg, #6dd7ae 0%, #74dbb5 50%, #6bbfcc 100%)',
    WebkitBackgroundClip: 'text',
    [breakpoints.md]: {
      top: 20,
      right: 18,
      marginTop: '20px',
      marginBottom: 30,
      fontSize: '46px',
    },
  },
});

export const Plumeria = () => {
  return <div className={css.props(styles.headings)}>Plumeria</div>;
};
