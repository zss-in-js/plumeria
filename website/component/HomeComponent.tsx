import Link from 'next/link';
import { css, ps } from '@plumeria/core';
import { Plumeria } from './Plumeria';
import { CodeBlock } from './CodeBlock';

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
    transform: 'translate(-50%, -50%)',
    [css.media.maxWidth(804)]: {
      top: 0,
      right: 'auto',
      left: 'auto',
      display: 'flex',
      width: '100%',
      height: 'auto',
      margin: '0 auto',
      transform: 'translate(0%, 30%)',
    },
  },

  inlineword: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '460px',
    marginBottom: '10px',
    fontSize: 21,
    fontWeight: 400,
    textAlign: 'center',
    wordBreak: 'break-all',
    [css.media.maxWidth(804)]: {
      top: 20,
      maxWidth: 300,
      fontSize: 19,
    },
  },
  link_box: {
    display: 'flex',
    flexDirection: 'row',
    gridGap: 20,
    [css.media.maxWidth(804)]: {
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
    textAlign: 'center',
    border: 'solid 2px currentColor',
    borderRadius: '12px',
    transition: 'all 0.1s',
    [ps.hover]: {
      color: 'white',
      background: '#ef2a86',
      border: 'solid 2px #ef2a86',
    },
    [css.media.maxWidth(804)]: {
      position: 'relative',
      left: -10,
      width: 180,
      marginRight: -20,
      whiteSpace: 'nowrap',
      scale: 0.8,
      [ps.hover]: {
        scale: 0.84,
      },
    },
  },
  getStarted: {
    color: 'white',
    background: '#ef2a86',
    border: 'solid 2px #ef2a86',
  },
  textSize: {
    fontSize: 16,
    [css.media.maxWidth(804)]: {
      fontSize: 14,
    },
  },
});

const demoCode = ` text: { fontSize: 16, color: 'pink' }
 ↓
.text_lgulad { font-size: 16px; color: pink; }`;

export const HomeComponent = () => {
  return (
    <main className={css.props(styles.container)}>
      <Plumeria />
      <div className={css.props(styles.inlineword)}>
        Zero-Runtime CSS-in-JS
        <br />
        <span className={css.props(styles.textSize)}>Compile at build-time. No runtime overhead.</span>
      </div>
      <CodeBlock code={demoCode} lang="css" />
      <div className={css.props(styles.link_box)}>
        <Link href="/docs/getting-started/installation" className={css.props(styles.button, styles.getStarted)}>
          GET STARTED
        </Link>
        <Link href="/docs" className={css.props(styles.button)}>
          THINKING
        </Link>
      </div>
    </main>
  );
};
