import { css, ps } from '@plumeria/core';

const styles = css.create({
  stack: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  button: {
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

export function FancyButtons() {
  return (
    <div className={css.props(styles.stack)}>
      <button className={css.props(styles.button, styles.hover, buttons.focusPurple)}>Purple</button>
      <button className={css.props(styles.button, styles.hover, buttons.focusSky)}>Sky</button>
      <button className={css.props(styles.button, styles.hover, buttons.focusGreen)}>Green</button>
    </div>
  );
}
