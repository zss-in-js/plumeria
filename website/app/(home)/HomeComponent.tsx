import Link from 'next/link';
import { css } from '@plumeria/core';

const styles = css.create({
  container: {
    position: 'absolute',
    top: 270,
    right: 400,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    [css.media.max('width: 804px')]: {
      position: 'static',
      right: 'auto',
      left: 'auto',
      display: 'flex',
      width: '100%',
      margin: '0 auto',
    },
  },

  headings: {
    marginBottom: '20px',
    fontSize: '40px',
    fontWeight: 600,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(45deg, #58c6ff 0%, #076ad9 40%, #ff3bef 80%)',
    WebkitBackgroundClip: 'text',
    [css.media.max('width: 800px')]: {
      marginTop: '54px',
      fontSize: '1.6rem',
    },
  },
  inlineword: {
    maxWidth: '460px',
    marginBottom: '40px',
    fontSize: 20,
    fontWeight: 350,
    textAlign: 'left',
    wordBreak: 'break-all',
    [css.media.max('width: 804px')]: {
      maxWidth: 300,
      fontSize: '1rem',
    },
  },
  button: {
    width: 220,
    padding: '16px 32px',
    marginRight: 260,
    fontSize: 20,
    fontWeight: '600',
    border: 'solid 2px currentColor',
    borderRadius: '50px',
    transition: 'all 0.2s',
    [css.pseudo.hover]: {
      color: '#ef2a86',
    },
    [css.media.max('width: 804px')]: {
      position: 'relative',
      left: 60,
      scale: 0.8,
    },
  },
});

export const HomeComponent = () => {
  return (
    <main className={styles.container}>
      <div className={styles.headings}>Zero-Runtime CSS in JS</div>
      <div className={styles.inlineword}>
        Generate CSS at build time from JavaScript object maps. Build screens with highly productive syntax and boost
        efficiency with linting.
      </div>

      <Link href="/docs" className={styles.button}>
        GET STARTED
      </Link>
    </main>
  );
};
