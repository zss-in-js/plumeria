import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { pseudos } from 'lib/pseudos';
import { Plumeria } from './Plumeria';
import { CodeBlock } from './CodeBlock';
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '0px',
    [breakpoints.md]: {
      flexDirection: 'column',
      gap: 40,
      alignItems: 'center',
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
      fontSize: 32,
      textAlign: 'center',
    },
  },

  subHeadline: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '600px',
    fontSize: 26,
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
    paddingTop: 32,
    paddingBottom: 20,
    [breakpoints.md]: {
      flexDirection: 'row', // Change to row for mobile
      gap: 12, // Slightly smaller gap for mobile
      width: 'auto', // Allow buttons to size naturally
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
    [pseudos.hover]: {
      borderColor: 'var(--card-hover-border)',
      transform: 'translateY(-2px)',
    },
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

const demoCode = `import * as css from '@plumeria/core';

const styles = css.create({
  featureCard: {
    position: 'relative',
    padding: '24px',
    background: 'var(--card-bg)',
    borderRadius: '16px',
    boxShadow: 'var(--card-box-shadow)',
    transition: 'all 0.3s ease',
    [pseudos.hover]: {
      borderColor: 'var(--card-hover-border)',
      transform: 'translateY(-2px)',
    },
    [breakpoints.md]: {
      padding: '24px',
    },
  },
});`;

export const HomeComponent = () => {
  return (
    <div>
      <main styleName={styles.container}>
        <section styleName={styles.heroSection}>
          <div styleName={styles.heroContent}>
            <h2 styleName={styles.mainHeadline}>
              <Plumeria />
              Styling System
            </h2>
            <h2 styleName={styles.mainHeadline}>That Disappears</h2>
            <p styleName={styles.subHeadline}>Fast · Composable · Predictable</p>
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
            <p styleName={styles.featureDescription}>Styles are reused keeping CSS bundle is always minimal.</p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Feather()}</div>
            <h3 styleName={styles.featureTitle}>Lightweight</h3>
            <p styleName={styles.featureDescription}>No runtime included.</p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>⚡</div>
            <h3 styleName={styles.featureTitle}>Build-time Compilation</h3>
            <p styleName={styles.featureDescription}>Styles compile to atomic class names at build time.</p>
          </div>

          <div styleName={styles.featureCard}>
            <div styleName={styles.featureIcon}>{svg.Eslint()}</div>
            <h3 styleName={styles.featureTitle}>Linting</h3>
            <p styleName={styles.featureDescription}>
              Build-integrated oxlint validation. Detect typos before compiling.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
