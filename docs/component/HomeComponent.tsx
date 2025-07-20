import Link from 'next/link';
import { css, ps } from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
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
    [breakpoints.md]: {
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
    [breakpoints.md]: {
      maxWidth: 300,
      fontSize: 20
},
  },
  link_box: {
    display: 'flex',
    flexDirection: 'row',
    gridGap: 20,
    ["@media (max-width: 768px)"]: {
      gridGap: 14,
    },
  },
  button: {
    position: 'relative',
    zIndex: 1,
    width: '160px',
    padding: '8px 26px',
    marginTop: 8,
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
    [breakpoints.md]: {
      position: 'relative',
      left: -10,
      width: 180,
      padding: '10px 26px',
      marginTop: 0,
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
    [breakpoints.md]: {
      fontSize: 14,
    },
  },
});

const gradi = css.create({
  gradient: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 0,
    width: 600,
    height: 600,
    pointerEvents: 'none',
    // eslint-disable-next-line @plumeria/validate-values
    background: 'radial-gradient(circle, rgba(0,255,255,0.2), rgba(0,128,128,0) 70%)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    ["@media (max-width: 768px)"]: {
      width: '100%',
      height: 600,
    },
  },
});

const demoCode = ` text: { fontSize: 16, color: "navy" }
 ↓
.zftshu08 { font-size: 16px; }
.zzie71ek { color: navy }`;
export const HomeComponent = () => {
  return (
    <main className={css.props(styles.container)}>
      <div className={css.props(gradi.gradient)} />
      <Plumeria />
      <div className={css.props(styles.inlineword)}>
        Atomic CSS-in-JS
        <br />
        <span className={css.props(styles.textSize)}>Compile at build-time. No-runtime overhead.</span>
      </div>
      <CodeBlock code={demoCode} lang="text" />
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
