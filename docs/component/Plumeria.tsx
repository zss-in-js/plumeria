import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { gradientShift } from './animation';

const styles = css.create({
  headings: {
    position: 'relative',
    left: -4,
    zIndex: 0,
    display: 'block',
    marginBottom: 8,
    fontSize: 52,
    fontWeight: 600,
    lineHeight: 1.1,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundClip: 'text',
    backgroundSize: '400% 400%',
    border: '1px solid transparent',
    filter: 'drop-shadow(0 0 2em rgba(168, 85, 247, 0.2))',
    animationName: gradientShift,
    animationDuration: '15s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
    [breakpoints.md]: {
      fontSize: 32, // Increased mobile size
    },
  },
});

export const Plumeria = () => {
  return <div className={css.props(styles.headings)}>Plumeria</div>;
};
