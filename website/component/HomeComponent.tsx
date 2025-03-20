'use client';

import Link from 'next/link';
import { css } from '@plumeria/core';
import { Component } from './Plumeria';

const styles = css.create({
  container: {
    position: 'relative',
    top: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100vh',
    textAlign: 'center',
    [css.media.max('width: 804px')]: {
      top: 0,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      width: '100%',
      height: 'auto',
      margin: '0 auto',
    },
  },

  inlineword: {
    position: 'relative',
    left: 14,
    zIndex: 1,
    maxWidth: '460px',
    marginBottom: '40px',
    fontSize: 21,
    fontWeight: 350,
    textAlign: 'left',
    wordBreak: 'break-all',
    [css.media.max('width: 804px')]: {
      maxWidth: 300,
      fontSize: '1rem',
    },
  },
  link_box: {
    display: 'flex',
    flexDirection: 'row',
    gridGap: 50,
    [css.media.max('width: 804px')]: {
      gridGap: 10,
    },
  },
  button: {
    position: 'relative',
    zIndex: 1,
    width: '220px',
    padding: '16px 32px',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    background: '#ef2a86',
    border: 'solid 2px #ef2a86',
    borderRadius: '50px',
    transition: 'all 0.2s',
    [css.pseudo.hover]: {
      scale: 1.05,
    },
    [css.media.max('width: 804px')]: {
      position: 'relative',
      left: -10,
      width: 200,
      marginRight: -20,
      whiteSpace: 'nowrap',
      scale: 0.8,
    },
  },
});

export const HomeComponent = () => {
  return (
    <main className={styles.container}>
      <Component />
      <div className={styles.inlineword}>
        Type-safe CSS object Maps.
        <br />
        Command Line for Precompilation.
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
