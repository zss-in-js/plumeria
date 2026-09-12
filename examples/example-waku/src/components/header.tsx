import { Link } from 'waku';
import * as css from '@plumeria/core';

const styles = css.create({
  header: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    padding: '1.5rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
  },
});

export const Header = () => {
  return (
    <header classStyle={styles.header}>
      <h2 classStyle={styles.title}>
        <Link to="/">Waku starter</Link>
      </h2>
    </header>
  );
};
