import Link from 'next/link';
import { css } from '@plumeria/core';

const styles = css.create({
  head: {
    position: 'absolute',
    right: 0,
    left: 0,
    width: 'fit-content',
    margin: 'auto',
    marginBottom: '1rem',
    fontSize: '2rem',
    fontWeight: 'bold',
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(90deg, #58c6ff 0%, #076ad9 40%, #ff3bef 80%)',
    transform: 'translateY(-100px)',
    WebkitBackgroundClip: 'text',
    [css.media.max('width: 800px')]: {
      fontSize: '1.6rem',
      transform: 'translateY(-80px)',
    },
  },
  tag: {
    position: 'relative',
    top: 60,
    marginBottom: '1rem',
    fontSize: '2rem',
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
    fontWeight: '600',
    border: 'solid 2px currentColor',
    borderRadius: '50px',
    transition: 'all 0.2s',
    [css.pseudo.hover]: {
      color: '#ef2a86',
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
        position: 'relative',
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
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
