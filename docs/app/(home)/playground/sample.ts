export const SAMPLE = `import * as css from '@plumeria/core';

export const Card = () => (
  <article classStyle={styles.card}>
    <div classStyle={styles.icon} aria-hidden="true">✳</div>
    <p classStyle={styles.eyebrow}>MADE WITH PLUMERIA</p>
    <h1 classStyle={styles.title}>Less code. More bloom.</h1>
    <p classStyle={styles.description}>
      A little style goes a long way. Build something beautiful
      with type-safe CSS and zero runtime.
    </p>
    <div classStyle={styles.actions}>
      <a classStyle={[styles.button, styles.primary]} href="/docs" target="_blank" rel="noreferrer">Docs ↗</a>
      <a classStyle={styles.button} href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer">GitHub ↗</a>
    </div>
  </article>
);

const styles = css.create({
  card: {
    maxWidth: 360,
    padding: 28,
    margin: '32px auto',
    color: 'light-dark(#20343b, #e6f0f2)',
    background: 'light-dark(#ffffff, #202b30)',
    borderRadius: 24,
    boxShadow: '0 16px 48px rgb(0 0 0 / 0.08)'
  },
  icon: {
    display: 'grid',
    placeItems: 'center',
    width: 56,
    height: 56,
    fontSize: 32,
    color: 'light-dark(#377c86, #a3dedc)',
    background: 'light-dark(#e8f4f3, #30494d)',
    borderRadius: 18
  },
  eyebrow: {
    margin: '28px 0 8px',
    fontSize: 11,
    fontWeight: 600,
    color: 'light-dark(#58818a, #a0bec5)',
    letterSpacing: '0.16em'
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.04em'
  },
  description: {
    margin: '14px 0 28px',
    lineHeight: 1.7,
    color: 'light-dark(#677b82, #a9bec5)',
  },
  actions: {
    display: 'flex',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: 'light-dark(#34515a, #d0e4e8)',
    textAlign: 'center',
    textDecoration: 'none',
    background: 'light-dark(#eef3f4, #31454c)',
    borderRadius: 12,
    transition: 'transform 160ms, opacity 160ms',
    ':hover': {
      transform: 'translateY(-2px)',
      opacity: 0.85
    },
    ':focus-visible': {
      outline: '2px solid #63a6bb',
      outlineOffset: 3
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      ':hover': {
        transform: 'none'
      },
    }
  },
  primary: {
    color: '#ffffff',
    background: '#367d87',
  },
});

`;
