import { css, ps } from '@plumeria/core';

const rotateHover = css.keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

const rotateFocus = css.keyframes({
  from: {
    transform: 'rotateY(0deg) rotateX(0deg)',
  },
  to: {
    transform: 'rotateY(360deg) rotateX(90deg)',
  },
});

const styles = css.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: 40,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '200px',
    height: '200px',
    fontSize: '1.25rem',
    fontWeight: '600',
    backgroundColor: '#fefefe',
    borderRadius: '2rem',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    transition: 'transform 0.4s ease, box-shadow 0.4s ease',
    [css.media.maxWidth(764)]: {
      width: '120px',
      height: '120px',
    },
  },
});

const animated = css.create({
  hover: {
    [ps.hover]: {
      background: css.color.azure,
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      animationName: rotateHover,
      animationDuration: '1s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  },
  focus: {
    [ps.focus]: {
      outline: '2px solid dodgerblue',
      animationName: rotateFocus,
      animationDuration: '0.8s',
      animationIterationCount: 'infinite',
    },
  },
});

export const Box = () => {
  return (
    <div className={styles.$container}>
      <span>
        hover
        <span tabIndex={0} className={css.props(styles.card, animated.hover)} />
      </span>
      <span>
        focus
        <span tabIndex={0} className={css.props(styles.card, animated.focus)} />
      </span>
    </div>
  );
};
