/* eslint-disable @plumeria/validate-values */

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
    gap: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '0px',
    [breakpoints.md]: {
      flexDirection: 'column',
      gap: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '80px',
      textAlign: 'center',
    },
  },

  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '680px',
    [breakpoints.md]: {
      alignItems: 'center', // Center on mobile
      width: '100%',
    },
  },

  mainHeadline: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 12,
    fontSize: 47,
    fontWeight: 600,
    lineHeight: 1,
    color: 'var(--text-main-header-line)',
    textAlign: 'left',
    [breakpoints.md]: {
      marginBottom: '16px',
      fontSize: 28,
      textAlign: 'center',
    },
  },

  subHeadline: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '600px',
    marginBottom: 32,
    fontSize: 24,
    fontWeight: 420,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    letterSpacing: '0.026em',
    [breakpoints.md]: {
      maxWidth: '90%',
      marginBottom: '32px',
      fontSize: 14,
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
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow), var(--card-cut-glass)',
    backdropFilter: 'blur(16px)',
    transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
    WebkitBackdropFilter: 'blur(16px)',
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

const demoCode = `const styles = css.create({
  featureCard: {
    position: 'relative',
    padding: '24px',
    background: 'var(--card-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    boxShadow: 'var(--card-shadow), var(--card-cut-glass)',
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
      <main className={css.use(styles.container)}>
        <section className={css.use(styles.heroSection)}>
          <div className={css.use(styles.heroContent, styles.codeSection)}>
            <h2 className={css.use(styles.mainHeadline)}>
              <Plumeria />
              Atomic CSS-in-JS
            </h2>
            <p className={css.use(styles.subHeadline)}>
              Zero-runtime overhead・Type-safe <br />
              Build-time only・High performance
            </p>
            <div className={css.use(styles.buttonGroup)}>
              <ButtonLink href="/docs" variant="getstarted">
                Get Started
              </ButtonLink>
              <ButtonLink href="/docs/getting-started/installation" variant="installation">
                Installation
              </ButtonLink>
            </div>
          </div>

          <div className={css.use(styles.codeSection)}>
            <CodeBlock code={demoCode} lang="typescript" />
          </div>
        </section>

        <section className={css.use(styles.featuresSection)}>
          <div className={css.use(styles.featureCard)}>
            <div className={css.use(styles.featureIcon)}>{svg.Atom()}</div>
            <h3 className={css.use(styles.featureTitle)}>Atomic CSS</h3>
            <p className={css.use(styles.featureDescription)}>
              Styles are reused keeping CSS bundle is always minimal.
            </p>
          </div>
          <div className={css.use(styles.featureCard)}>
            <div className={css.use(styles.featureIcon)}>{svg.Eslint()}</div>
            <h3 className={css.use(styles.featureTitle)}>Linting</h3>
            <p className={css.use(styles.featureDescription)}>
              Build-integrated oxlint validation. Detect typos before compiling.
            </p>
          </div>

          <div className={css.use(styles.featureCard)}>
            <div className={css.use(styles.featureIcon)}>{svg.Feather()}</div>
            <h3 className={css.use(styles.featureTitle)}>Lghtweight</h3>
            <p className={css.use(styles.featureDescription)}>
              min + brotli 1 byte. <br /> Before compression 0 byte.
            </p>
          </div>
          <div className={css.use(styles.featureCard)}>
            <div className={css.use(styles.featureIcon)}>⚡</div>
            <h3 className={css.use(styles.featureTitle)}>Build-time Compilation</h3>
            <p className={css.use(styles.featureDescription)}>Eliminate styles compile to class names at built time.</p>
          </div>
        </section>
      </main>
    </div>
  );
};
