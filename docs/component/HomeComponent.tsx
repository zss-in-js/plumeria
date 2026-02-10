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
    lineHeight: 1.4,
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
    fontWeight: 400,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    letterSpacing: '0.01em',
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

  // Theme-aware card style using CSS variables
  featureCard: {
    position: 'relative',
    padding: '24px',
    background: 'var(--card-bg)',
    border: '1px solid transparent',
    borderRadius: '12px',
    transition: 'border-color 0.2s, transform 0.2s',
    [pseudos.hover]: {
      borderColor: 'var(--card-hover-border)',
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

  highlight: {
    fontWeight: 600,
    color: '#22d3ee', // Keep cyan highlight in both themes
  },
});

const demoCode = `const styles = css.create({
  featureCard: {
    position: 'relative',
    padding: '24px',
    background: 'var(--card-bg)',
    border: '1px solid transparent',
    borderRadius: '12px',
    transition: 'border-color 0.2s, transform 0.2s',
    [pseudos.hover]: {
      borderColor: 'var(--card-hover-border)',
    },
    [breakpoints.md]: {
      padding: '24px',
    },
  },
});`;

export const HomeComponent = () => {
  return (
    <div>
      <main className={css.props(styles.container)}>
        <section className={css.props(styles.heroSection)}>
          <div className={css.props(styles.heroContent)}>
            <h2 className={css.props(styles.mainHeadline)}>
              <Plumeria />
              Type-Only CSS Extract
            </h2>
            <p className={css.props(styles.subHeadline)}>Build-time Compilation・No Bundle Size</p>
            <div className={css.props(styles.buttonGroup)}>
              <ButtonLink href="/docs" variant="gradient">
                Thinking in Plumeria
              </ButtonLink>
              <ButtonLink href="/docs/getting-started/installation" variant="metallic">
                Installation
              </ButtonLink>
            </div>
          </div>

          <div className={css.props(styles.codeSection)}>
            <CodeBlock code={demoCode} lang="typescript" />
          </div>
        </section>

        <section className={css.props(styles.featuresSection)}>
          <div className={css.props(styles.featureCard)}>
            <div className={css.props(styles.featureIcon)}>{svg.Atom()}</div>
            <h3 className={css.props(styles.featureTitle)}>Atomic CSS</h3>
            <p className={css.props(styles.featureDescription)}>
              Generates <span className={css.props(styles.highlight)}>atomic CSS classes</span> at build time. Styles
              are reused automatically, keeping your CSS bundle minimal.
            </p>
          </div>

          <div className={css.props(styles.featureCard)}>
            <div className={css.props(styles.featureIcon)}>{svg.TurbopackIcon()}</div>
            <h3 className={css.props(styles.featureTitle)}>Turbopack</h3>
            <p className={css.props(styles.featureDescription)}>
              Native <span className={css.props(styles.highlight)}>Next.js integration</span>. Instant HMR updates and a
              development flow that stays in full acceleration.
            </p>
          </div>

          <div className={css.props(styles.featureCard)}>
            <div className={css.props(styles.featureIcon)}>{svg.Eslint()}</div>
            <h3 className={css.props(styles.featureTitle)}>Type-Safe</h3>
            <p className={css.props(styles.featureDescription)}>
              Complete TypeScript safety with <span className={css.props(styles.highlight)}>build-integrated </span>
              ESLint validation. Detect typos before compiling.
            </p>
          </div>

          <div className={css.props(styles.featureCard)}>
            <div className={css.props(styles.featureIcon)}>⚡</div>
            <h3 className={css.props(styles.featureTitle)}>Build-time Compilation</h3>
            <p className={css.props(styles.featureDescription)}>
              Styles are compiled to static CSS at <span className={css.props(styles.highlight)}>build time</span>.
              Eliminate styles and compile to class names.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
