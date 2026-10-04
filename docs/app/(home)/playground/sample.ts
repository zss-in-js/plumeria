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
  <main classStyle={styles.canvas}>
    <article classStyle={styles.card}>
      <div classStyle={styles.heading}>
        <div classStyle={styles.icon} aria-hidden="true">
          <span classStyle={styles.crab} />
        </div>
        <p classStyle={styles.eyebrow}>PLUMERIA</p>
      </div>
      <h1 classStyle={styles.title}>Rust-based CSS compiler</h1>
      <p classStyle={styles.description}>
        Type-safe CSS, compiled to zero runtime.
        <br />
        Edit any style and watch it land live.
      </p>
      <div classStyle={styles.actions}>
        <a classStyle={[styles.button, styles.primary]} href="/docs" target="_blank" rel="noreferrer">Docs ↗</a>
        <a classStyle={styles.button} href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </article>
  </main>
);

const scuttle = css.keyframes({
  from: {
    transform: 'translateX(-3px)'
  },
  to: {
    transform: 'translateX(3px)'
  },
});

const styles = css.create({
  canvas: {
    position: 'fixed',
    inset: 0,
    display: 'grid',
    padding: 24,
    overflow: 'auto',
    background: theme.canvas,
  },
  card: {
    boxSizing: 'border-box',
    width: 420,
    maxWidth: '100%',
    padding: tokens.space,
    margin: 'auto',
    color: theme.text,
    background: theme.surface,
    borderColor: theme.border,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: tokens.radius,
    boxShadow: theme.shadow
  },
  heading: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    display: 'grid',
    flexShrink: 0,
    placeItems: 'center',
    width: 40,
    height: 36,
  },
  crab: {
    position: 'relative',
    width: 28,
    height: 18,
    background: \`radial-gradient(circle at 35% 40%, \${theme.crabSoft} 2px, transparent 2.5px), radial-gradient(circle at 65% 40%, \${theme.crabSoft} 2px, transparent 2.5px), \${theme.crab}\`,
    borderRadius: '50% 50% 45% 45%',
    isolation: 'isolate',
    animation: \`\${scuttle} 0.6s ease-in-out infinite alternate\`,
    '::before': {
      position: 'absolute',
      top: -7,
      left: -6,
      zIndex: -1,
      width: 10,
      height: 10,
      content: '""',
      background: theme.crab,
      borderRadius: '50% 50% 0 50%',
      boxShadow: \`30px 0 \${theme.crab}\`
    },
    '::after': {
      position: 'absolute',
      top: 8,
      left: -5,
      zIndex: -1,
      width: 38,
      height: 10,
      content: '""',
      background: \`repeating-linear-gradient(to bottom, \${theme.crab} 0 2px, transparent 2px 4px)\`
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: theme.accent,
    letterSpacing: '0.16em'
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.04em'
  },
  description: {
    margin: '10px 0 20px',
    lineHeight: 1.7,
    color: theme.muted,
  },
  actions: {
    display: 'flex',
    gap: tokens.gap,
  },
  button: {
    boxSizing: 'border-box',
    display: 'flex',
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 40,
    padding: '10px 20px',
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
  canvas: { default: '#e4e7ed', theme: '#18181b' },
  surface: { default: '#f5f6f8', theme: '#1c1f27' },
  border: { default: '#cbd1dc', theme: '#2a2f3a' },
  shadow: { default: '0 16px 48px rgb(31 36 48 / 0.10)', theme: '0 16px 48px rgb(0 0 0 / 0.08)' },
  text: { default: '#1f2430', theme: '#e9edf5' },
  muted: { default: '#596273', theme: '#a4acbd' },
  accent: { default: '#365dcc', theme: '#5b8cff' },
  onAccent: { default: '#ffffff', theme: '#0b1533' },
  crab: { default: '#e5484d', theme: '#ff6369' },
  crabSoft: { default: '#fde8e8', theme: '#4a1f22' },
  tint: { default: '#e1e5ee', theme: '#2e3442' },
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
