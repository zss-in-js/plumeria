export type SampleFile = {
  path: string;
  label: string;
  source: string;
};

export const ENTRY = '/playground.tsx';

export const SAMPLE_FILES: SampleFile[] = [
  {
    path: ENTRY,
    label: 'Card.tsx',
    source: `import * as css from '@plumeria/core';
import { theme } from './theme';
import { tokens } from './tokens';

export const Card = () => (
  <article classStyle={styles.card}>
    <div classStyle={styles.icon} aria-hidden="true">✳</div>
    <h1 classStyle={styles.title}>Less code. More bloom.</h1>
    <p classStyle={styles.description}>
      Type-safe CSS with zero runtime. Change a color and watch it land.
    </p>
    <div classStyle={styles.actions}>
      <a classStyle={[styles.button, styles.primary]} href="/docs" target="_blank" rel="noreferrer">Docs ↗</a>
      <a classStyle={styles.button} href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer">GitHub ↗</a>
    </div>
  </article>
);

const bloom = css.keyframes({
  from: {
    transform: 'scale(1)'
  },
  to: {
    transform: 'scale(1.12)'
  },
});

const styles = css.create({
  card: {
    maxWidth: 360,
    padding: tokens.space,
    margin: '32px auto',
    color: theme.text,
    background: theme.surface,
    borderRadius: tokens.radius,
    boxShadow: '0 16px 48px rgb(0 0 0 / 0.08)'
  },
  icon: {
    display: 'grid',
    placeItems: 'center',
    width: 56,
    height: 56,
    margin: '0 0 28px',
    fontSize: 32,
    color: theme.accent,
    background: theme.tint,
    borderRadius: 18,
    animation: \`\${bloom} 2.4s ease-in-out infinite alternate\`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.04em'
  },
  description: {
    margin: '14px 0 28px',
    lineHeight: 1.7,
    color: theme.muted,
    textWrap: 'balance',
  },
  actions: {
    display: 'flex',
    gap: tokens.gap,
  },
  button: {
    flex: 1,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: theme.text,
    textAlign: 'center',
    textDecoration: 'none',
    background: theme.tint,
    borderRadius: tokens.pill,
    transition: 'transform 160ms',
    ':hover': {
      transform: 'translateY(-2px)'
    },
    ':focus-visible': {
      outline: \`2px solid \${theme.accent}\`,
      outlineOffset: 3
    }
  },
  primary: {
    color: theme.onAccent,
    background: theme.accent,
  },
});
`,
  },
  {
    path: '/theme.ts',
    label: 'theme.ts',
    source: `import * as css from '@plumeria/core';

export const theme = css.createTheme('.dark', {
  surface: { default: '#ffffff', theme: '#202b30' },
  text: { default: '#20343b', theme: '#e6f0f2' },
  muted: { default: '#677b82', theme: '#a9bec5' },
  accent: { default: '#367d87', theme: '#63a6bb' },
  onAccent: { default: '#ffffff', theme: '#11242b' },
  tint: { default: '#eef3f4', theme: '#3a5560' },
});
`,
  },
  {
    path: '/tokens.ts',
    label: 'tokens.ts',
    source: `import * as css from '@plumeria/core';

export const tokens = css.createStatic({
  radius: 24,
  pill: 12,
  space: 28,
  gap: 10,
});
`,
  },
];
