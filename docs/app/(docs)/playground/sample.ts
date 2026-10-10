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

const External = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M11 5H4v15h15v-7" />
    <path d="M14 3h7v7M21 3 11 13" />
  </svg>
);

export const Card = () => (
  <main classStyle={styles.canvas}>
    <article classStyle={styles.card}>
      <div classStyle={styles.heading}>
        <img src="/logo.svg" alt="" width={24} height={24} />
        <p classStyle={styles.eyebrow}>PLUMERIA</p>
      </div>
      <h1 classStyle={styles.title}>Rust-based CSS compiler</h1>
      <p classStyle={styles.description}>
        Type-safe CSS, compiled to zero runtime.
        <br />
        Edit any style and watch it land live.
      </p>
      <div classStyle={styles.actions}>
        <a classStyle={[styles.button, styles.primary]} href="/docs" target="_blank" rel="noreferrer">
          Docs <External />
        </a>
        <a classStyle={styles.button} href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer">
          GitHub <External />
        </a>
      </div>
    </article>
  </main>
);

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
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: theme.accent,
    letterSpacing: '0.12em'
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.03em'
  },
  description: {
    margin: '12px 0 24px',
    fontSize: 15,
    lineHeight: 1.6,
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
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 40,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: theme.text,
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
