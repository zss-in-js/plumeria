import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { Plumeria } from './Plumeria';
import { CodeBlock, InstallCode } from './CodeBlock';
import { ButtonLink } from './ButtonLink';
import { svg } from './svg';

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
    padding: '120px 40px 80px',
    margin: '0 auto',
    [breakpoints.md]: {
      padding: '80px 20px 60px',
    },
  },

  heroSection: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '0px',
    [breakpoints.md]: {
      flexDirection: 'column',
      gap: 40,
      alignItems: 'flex-end',
      justifyContent: 'center',
      textAlign: 'center',
    },
  },

  heroContent: {
    display: 'flex',
    flexDirection: 'column',
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
    fontSize: 51.2,
    fontWeight: 600,
    lineHeight: 1,
    color: 'var(--text-main-header-line)',
    textAlign: 'left',
    [breakpoints.md]: {
      marginBottom: 8,
      fontSize: 26.2,
      textAlign: 'center',
      whiteSpace: 'nowrap',
    },
  },

  subHeadline: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '600px',
    fontSize: 24,
    fontWeight: 420,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    letterSpacing: '0.026em',
    [breakpoints.md]: {
      maxWidth: '90%',
      fontSize: 18,
      textAlign: 'center',
      textWrap: 'balance',
    },
  },

  codeSection: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: '600px',
    [breakpoints.md]: {
      justifyContent: 'center',
      maxWidth: '100%',
    },
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    paddingTop: 20,
    paddingBottom: 20,
    [breakpoints.md]: {
      paddingTop: 25,
    },
  },

  featuresSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 24,
    width: '100%',
    maxWidth: '1200px',
    marginTop: 40,
    [breakpoints.md]: {
      gridTemplateColumns: '1fr',
      gap: 20,
      maxWidth: '500px',
    },
  },

  featureCard: {
    position: 'relative',
    padding: '24px',
    background: 'var(--card-bg)',
    borderRadius: '16px',
    boxShadow: 'var(--card-box-shadow)',
    transition: 'all 0.3s ease',
    [breakpoints.md]: {
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
    color: 'var(--icon-color)',
    background: 'var(--icon-bg)',
    borderRadius: '8px',
  },

  featureTitle: {
    marginBottom: '12px',
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-main-header-line)',
  },

  featureDescription: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
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
    <div styleName={styles.box}>Hello, Plumeria Box!</div>
  );
};`;

const installCode = `$ pnpm install -D @plumeria/core`;

export const HomeComponent = () => {
  return (
    <div>
      <main styleName={styles.container}>
        <section styleName={styles.heroSection}>
          <div styleName={styles.heroContent}>
            <h2 styleName={styles.mainHeadline}>
              <Plumeria />
              Zero-Cost Abstraction
            </h2>
            <p styleName={styles.subHeadline}>Fast · Composable · Predictable</p>
            <InstallCode code={installCode} lang="text" />
            <div styleName={styles.buttonGroup}>
              <ButtonLink href="/docs" variant="getstarted">
                Get Started
              </ButtonLink>
              <ButtonLink href="/docs/getting-started/installation" variant="installation">
                Installation
              </ButtonLink>
            </div>
          </div>

          <div styleName={styles.codeSection}>
            <CodeBlock code={demoCode} lang="typescript" />
          </div>
        </section>

        <section styleName={styles.featuresSection}>
          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Atom()}</div>
            <h3 styleName={styles.featureTitle}>Atomic CSS</h3>
            <p styleName={styles.featureDescription}>
              The abstracted layers you control will be automatically atomized.
            </p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Feather()}</div>
            <h3 styleName={styles.featureTitle}>Lightweight</h3>
            <p styleName={styles.featureDescription}>The runtime is not included from the start.</p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>⚡</div>
            <h3 styleName={styles.featureTitle}>Build time</h3>
            <p styleName={styles.featureDescription}>
              All style processing completes at build time leaving no runtime cost.
            </p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Eslint()}</div>
            <h3 styleName={styles.featureTitle}>Linting</h3>
            <p styleName={styles.featureDescription}>This improves efficiency during editing.</p>
          </div>
        </section>
      </main>
    </div>
  );
};
