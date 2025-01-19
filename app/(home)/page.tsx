import Link from 'next/link';
import { css } from '@plumeria/core';

const styles = css.create({
  head: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    width: 'fit-content',
    position: 'absolute',
    left: 0,
    right: 0,
    transform: 'translateY(-100px)',
    margin: 'auto',
    background: 'linear-gradient(90deg, #58c6ff 0%, #076ad9 40%, #ff3bef 80%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    [css.media.max('width: 800px')]: {
      transform: 'translateY(-80px)',
      fontSize: '1.6rem',
    },
  },
  tag: {
    position: 'relative',
    top: 60,
    fontSize: '2rem',
    marginBottom: '1rem',
    [css.media.max('width: 800px')]: {
      top: 54,
      fontSize: '1.6rem',
    },
  },
  button: {
    boxSizing: 'border-box',
    width: 224,
    height: 63.5,
    padding: '16px 30px',
    fontSize: 20,
    borderRadius: '50px',
    border: 'solid 2px currentColor',
    fontWeight: '600',
    transition: 'all 0.2s',
    [css.pseudo.hover]: {
      color: '#ef2a86',
      border: 'solid 2px ff3bef',
    },
    [css.media.max('width: 800px')]: {
      fontSize: '15px',
    },
  },
});

export default function HomePage() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div className={styles.head}>Plumeria</div>
      <p>
        <Link href="/docs" className={styles.button}>
          GET STARTED
        </Link>
      </p>
      <div className={styles.tag}>Zero-Runtime CSS in JS</div>
    </main>
  );
}
