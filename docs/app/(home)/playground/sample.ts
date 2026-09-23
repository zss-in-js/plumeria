export const SAMPLE = `import * as css from '@plumeria/core';

const styles = css.create({
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    color: '#1f2933',
    background: '#ffffff',
    borderRadius: 12,
    transition: 'transform 120ms ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
    '@media (max-width: 640px)': {
      padding: 12,
    },
  },
});

export const Card = () => <div classStyle={styles.card}>Plumeria</div>;
`;
