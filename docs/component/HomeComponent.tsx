import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { CodeBlock } from './CodeBlock';
import { ButtonLink } from './ButtonLink';
import { svg } from './svg';
import { theme } from 'lib/theme';
import Image from 'next/image';

const typing1 = css.keyframes({
  '0%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
  },
  '15%': {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
  },
  '40%': {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
  },
  '48%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
  },
  '49%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  '100%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
});

const cursor1 = css.keyframes({
  '0%': {
    left: '0%',
    opacity: 1,
  },
  '15%': {
    left: 'calc(100% - 4px)',
    opacity: 1,
  },
  '19%': {
    opacity: 0,
  },
  '23%': {
    opacity: 1,
  },
  '27%': {
    opacity: 0,
  },
  '31%': {
    opacity: 1,
  },
  '35%': {
    opacity: 0,
  },
  '39%': {
    opacity: 1,
  },
  '40%': {
    left: 'calc(100% - 4px)',
    opacity: 1,
  },
  '48%': {
    left: '0%',
    opacity: 1,
  },
  '49%': {
    left: '0%',
    opacity: 0,
  },
  '100%': {
    left: '0%',
    opacity: 0,
  },
});

const typing2 = css.keyframes({
  '0%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  '49%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  '50%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
  },
  '65%': {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
  },
  '90%': {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
  },
  '98%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 1,
  },
  '99%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  '100%': {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
});

const cursor2 = css.keyframes({
  '0%': {
    left: '0%',
    opacity: 0,
  },
  '49%': {
    left: '0%',
    opacity: 0,
  },
  '50%': {
    left: '0%',
    opacity: 1,
  },
  '65%': {
    left: 'calc(100% - 4px)',
    opacity: 1,
  },
  '69%': {
    opacity: 0,
  },
  '73%': {
    opacity: 1,
  },
  '77%': {
    opacity: 0,
  },
  '81%': {
    opacity: 1,
  },
  '85%': {
    opacity: 0,
  },
  '89%': {
    opacity: 1,
  },
  '90%': {
    left: 'calc(100% - 4px)',
    opacity: 1,
  },
  '98%': {
    left: '0%',
    opacity: 1,
  },
  '99%': {
    left: '0%',
    opacity: 0,
  },
  '100%': {
    left: '0%',
    opacity: 0,
  },
});

const styles = css.create({
  container: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: '1280px',
    minHeight: '100vh',
    padding: '80px 40px 80px',
    margin: '0 auto',
    [breakpoints.md]: {
      padding: '80px 20px 60px',
    },
  },

  heroSection: {
    display: 'grid',
    gridTemplateRows: 'auto auto',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px 40px',
    alignItems: 'flex-end',
    width: '100%',
    [breakpoints.md]: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32,
      alignItems: 'center',
      textAlign: 'center',
    },
  },
  headings: {
    position: 'relative',
    left: '-0.07em',
    zIndex: 0,
    display: 'block',
    fontSize: 'clamp(36px, 6.5vw, 56px)',
    fontWeight: 600,
    lineHeight: 1.1,
    WebkitTextFillColor: 'transparent',
    background: 'linear-gradient(-45deg,#23d5ab, #23a6d5)',
    backgroundClip: 'text',
    filter: 'hue-rotate(372deg)',
    [breakpoints.md]: {
      fontSize: 'clamp(26px, 8vw, 36px)',
    },
  },
  headings2: {
    display: 'block',
    marginTop: 6,
  },

  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gridRow: '1',
    gridColumn: '1',
    alignItems: 'flex-start',
    maxWidth: '680px',
    [breakpoints.md]: {
      alignItems: 'center',
      width: '100%',
    },
  },

  mainHeadline: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 12,
    fontSize: 'clamp(32px, 5.5vw, 51.2px)',
    fontWeight: 600,
    lineHeight: 1,
    color: theme.textMainHeaderLine,
    textAlign: 'left',
    [breakpoints.md]: {
      marginBottom: 8,
      fontSize: 'clamp(24px, 6.5vw, 32px)',
      textAlign: 'center',
      whiteSpace: 'nowrap',
    },
  },

  subHeadlineWrapper: {
    position: 'relative',
    zIndex: 1,
    display: 'inline-block',
    width: '100%',
    maxWidth: '600px',
    minHeight: '40px',
    textAlign: 'left',
    [breakpoints.md]: {
      maxWidth: '90%',
      minHeight: '30px',
      textAlign: 'center',
    },
  },

  typingText1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 'max-content',
    paddingRight: '8px',
    overflow: 'visible',
    fontSize: 'clamp(18px, 2.2vw, 24px)',
    fontWeight: 420,
    lineHeight: 1.6,
    color: theme.textSecondary,
    letterSpacing: '0.026em',
    whiteSpace: 'nowrap',
    animationName: typing1,
    animationDuration: '16s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    [breakpoints.md]: {
      left: '50%',
      fontSize: 'clamp(14px, 4.2vw, 18px)',
      transform: 'translateX(-50%)',
    },
    '::after': {
      position: 'absolute',
      top: '10%',
      bottom: '10%',
      width: '2px',
      content: '""',
      backgroundColor: theme.textSecondary,
      animationName: cursor1,
      animationDuration: '16s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  },

  typingText2: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 'max-content',
    paddingRight: '8px',
    overflow: 'visible',
    fontSize: 'clamp(18px, 2.2vw, 24px)',
    fontWeight: 420,
    lineHeight: 1.6,
    color: theme.textSecondary,
    letterSpacing: '0.026em',
    whiteSpace: 'nowrap',
    animationName: typing2,
    animationDuration: '16s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    [breakpoints.md]: {
      left: '50%',
      fontSize: 'clamp(14px, 4.2vw, 18px)',
      transform: 'translateX(-50%)',
    },
    '::after': {
      position: 'absolute',
      top: '10%',
      bottom: '10%',
      width: '2px',
      content: '""',
      backgroundColor: theme.textSecondary,
      animationName: cursor2,
      animationDuration: '16s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  },

  imageSection: {
    position: 'absolute',
    top: '60px',
    left: '55%',
    zIndex: 0,
    width: '40%',
    paddingBottom: 40,
    paddingLeft: 40,
    [breakpoints.md]: {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingBottom: 0,
      paddingLeft: 0,
      marginBottom: 16,
    },
  },

  image: {
    margin: '-90px',
    filter: 'hue-rotate(342deg) saturate(0.5) contrast(0.8) drop-shadow(0 0 20px rgba(107, 201, 255, 0.6))',
    [breakpoints.md]: {
      width: '200px',
      height: '200px',
      margin: '-40px 0',
    },
  },

  codeSection: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    [breakpoints.md]: {
      maxWidth: '100%',
    },
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    gridRow: '2',
    gridColumn: '1',
    gap: 20,
    paddingTop: 10,
    paddingBottom: 20,
    [breakpoints.md]: {
      justifyContent: 'center',
      width: '100%',
      paddingTop: 0,
      paddingBottom: 0,
    },
  },

  featuresSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 24,
    width: '100%',
    maxWidth: '1200px',
    [breakpoints.md]: {
      gridTemplateColumns: '1fr',
      gap: 20,
      maxWidth: '500px',
    },
  },

  featureCard: {
    position: 'relative',
    width: 274,
    height: 220,
    padding: 24,
    background: theme.cardBg,
    borderRadius: '16px',
    boxShadow: theme.cardBoxShadow,
    transition: 'all 0.3s ease',
    [breakpoints.md]: {
      width: '100%',
      padding: '24px',
    },
  },

  featureIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    marginBottom: '20px',
    fontSize: 18,
    color: theme.iconColor,
    background: theme.iconBg,
    borderRadius: '8px',
  },

  featureTitle: {
    marginBottom: '12px',
    fontSize: 18,
    fontWeight: 600,
    color: theme.textMainHeaderLine,
  },

  featureDescription: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.6,
    color: theme.textSecondary,
  },
});

const demoCode = `import * as css from "@plumeria/core";

const styles = css.create({
  box: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const Box = () => {
  return (
    <div styleName={styles.box}>Box</div>
  );
};`;

export const HomeComponent = () => {
  return (
    <div>
      <main styleName={styles.container}>
        <section styleName={styles.heroSection}>
          <div styleName={styles.imageSection}>
            <Image styleName={styles.image} src="/LP_LG.png" alt="Plumeria logo" width={420} height={420} priority />
          </div>

          <div styleName={styles.heroContent}>
            <h2 styleName={styles.mainHeadline}>
              <span styleName={styles.headings}>Plumeria</span>
              <span styleName={styles.headings2}>Abstraction layer</span>
            </h2>
            <div styleName={styles.subHeadlineWrapper}>
              <span styleName={styles.typingText1}>A library for more ambitious interfaces</span>
              <span styleName={styles.typingText2}>Pure · Self-evident · Mathematical</span>
            </div>
          </div>

          <div styleName={styles.buttonGroup}>
            <ButtonLink href="/docs">Introduction</ButtonLink>
            <ButtonLink href="/docs/getting-started/installation">Installation</ButtonLink>
          </div>
        </section>

        <section styleName={styles.featuresSection}>
          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Ghost()}</div>
            <h3 styleName={styles.featureTitle}>Ghostly</h3>
            <p styleName={styles.featureDescription}>
              The core implementation does not use JavaScript. Therefore, there is no footprint.
            </p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Eslint()}</div>
            <h3 styleName={styles.featureTitle}>Linting</h3>
            <p styleName={styles.featureDescription}>This improves efficiency during editing.</p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>⚡</div>
            <h3 styleName={styles.featureTitle}>Build time</h3>
            <p styleName={styles.featureDescription}>
              All style processing completes at build time leaving no runtime cost.
            </p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Atom()}</div>
            <h3 styleName={styles.featureTitle}>Atomic CSS</h3>
            <p styleName={styles.featureDescription}>Abstracted layers are automatically atomized.</p>
          </div>
        </section>

        <div styleName={styles.codeSection}>
          <CodeBlock code={demoCode} lang="jsx" />
        </div>
      </main>
    </div>
  );
};
