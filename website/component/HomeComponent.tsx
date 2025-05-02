import Link from 'next/link';
import { css } from '@plumeria/core';
import { Plumeria } from './Plumeria';

const styles = css.create({
  container: {
    position: 'relative',
    top: 180,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 600,
    height: 'fit-content',
    textAlign: 'center',
    [css.media.max('width: 804px')]: {
      top: 0,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      margin: '0 auto',
    },
  },

  inlineword: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '460px',
    marginBottom: '40px',
    fontSize: 21,
    fontWeight: 350,
    textAlign: 'center',
    wordBreak: 'break-all',
    [css.media.max('width: 804px')]: {
      top: 20,
      maxWidth: 300,
      fontSize: '1rem',
    },
  },
  link_box: {
    display: 'flex',
    flexDirection: 'row',
    gridGap: 50,
    [css.media.max('width: 804px')]: {
      gridGap: 14,
    },
  },
  button: {
    position: 'relative',
    zIndex: 1,
    width: '200px',
    padding: '16px 32px',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    background: '#ef2a86',
    border: 'solid 2px #ef2a86',
    borderRadius: '50px',
    transition: 'all 0.2s',
    [css.pseudo.hover]: {
      scale: 1.025,
    },
    [css.media.max('width: 804px')]: {
      position: 'relative',
      left: -10,
      width: 180,
      marginRight: -20,
      whiteSpace: 'nowrap',
      scale: 0.8,
      [css.pseudo.hover]: {
        scale: 0.84,
      },
    },
  },
});

export const HomeComponent = () => {
  return (
    <main className={styles.container}>
      <Plumeria />
      <div className={styles.inlineword}>
        Zero-Runtime CSS-in-JS
        <br />
        Command-line for faster Precompilation
      </div>
      <div className={styles.link_box}>
        <Link href="/docs/getting-started/installation" className={styles.button}>
          GET STARTED
        </Link>
        <Link href="/docs" className={styles.button}>
          Thinking
        </Link>
      </div>
    </main>
  );
};
