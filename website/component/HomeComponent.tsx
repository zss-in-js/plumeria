'use client';

import Link from 'next/link';
import { css, cx } from '@plumeria/core';
import { Plumeria } from './Plumeria';

const styles = css.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transform: 'translate(-50%, -50%)',
    [css.media.max('width: 804px')]: {
      top: 0,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      width: '100%',
      height: 'auto',
      margin: '0 auto',
      transform: 'translate(0%, 50%)',
    },
  },

  inlineword: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '460px',
    marginBottom: '40px',
    fontSize: 21,
    fontWeight: 400,
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
    width: '180px',
    padding: '12px 26px',
    fontSize: 15,
    fontWeight: '600',
    border: 'solid 2px #ef2a86',
    borderRadius: '50px',
    transition: 'all 0.1s',
    [css.pseudo.hover]: {
      color: 'white',
      background: '#ef2a86',
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
  getStarted: {
    color: 'white',
    background: '#ef2a86',
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
        <Link href="/docs/getting-started/installation" className={cx(styles.button, styles.getStarted)}>
          GET STARTED
        </Link>
        <Link href="/docs" className={styles.button}>
          Thinking
        </Link>
      </div>
    </main>
  );
};
