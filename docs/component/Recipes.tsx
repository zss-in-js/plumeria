import { css } from '@plumeria/core';
import { ps } from 'lib/pseudos';
import { rotateFocus, rotateHover } from 'lib/animation';
import { breakpoints } from 'lib/mediaQuery';

const styles = css.create({
  stack: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  button: {
    position: 'relative',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '0.75rem',
    boxShadow: '0 6px 16px rgba(79,70,229,0.3)',
    transition: 'all 0.3s ease',
  },
  hover: {
    [ps.hover]: {
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      transform: 'translateY(-2px)',
    },
  },
});

const buttons = css.create({
  focusPurple: {
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    [ps.hover]: {
      background: 'linear-gradient(135deg, #3932c0, #6366f1)',
    },
    [ps.focus]: {
      outline: '2px solid #a5b4fc',
      outlineOffset: '4px',
    },
  },
  focusSky: {
    background: 'linear-gradient(135deg, #16adf9, #3ce1fb)',
    [ps.hover]: {
      background: 'linear-gradient(135deg, #0c9ce4, #3ce1fb)',
    },
    [ps.focus]: {
      outline: '2px solid #82c3e4',
      outlineOffset: '4px',
    },
  },
  focusGreen: {
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    [ps.hover]: {
      background: 'linear-gradient(135deg, #089e6c, #34d399)',
    },
    [ps.focus]: {
      outline: '2px solid #5bd3ab',
      outlineOffset: '4px',
    },
  },
});

const stylesBox = css.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: 40,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 200,
    fontSize: 36,
    borderRadius: 10,
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    [breakpoints.md]: {
      width: 80,
      height: 120,
      fontSize: 28,
    },
  },
});

const animated = css.create({
  hover: {
    [ps.hover]: {
      outline: '1px solid dodgerblue',
      animationName: rotateHover,
      animationDuration: '0.7s',
    },
  },
  focus: {
    [ps.hover]: {
      outline: '1px solid orange',
      animationName: rotateFocus,
      animationDuration: '0.8s',
    },
  },
});

export function Box() {
  return (
    <div className={css.props(stylesBox.container)}>
      <span>
        <span tabIndex={0} className={css.props(stylesBox.card, animated.hover)}>
          A
        </span>
      </span>
      <span>
        <span tabIndex={0} className={css.props(stylesBox.card, animated.focus)}>
          B
        </span>
      </span>
    </div>
  );
}

export function FancyButtons() {
  return (
    <div className={css.props(styles.stack)}>
      <button className={css.props(styles.button, styles.hover, buttons.focusPurple)}>Purple</button>
      <button className={css.props(styles.button, styles.hover, buttons.focusSky)}>Sky</button>
      <button className={css.props(styles.button, styles.hover, buttons.focusGreen)}>Green</button>
    </div>
  );
}
