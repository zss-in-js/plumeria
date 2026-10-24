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
import { useState } from 'react';
import { theme } from './theme';
import { breakpoints, tokens } from './tokens';

const COMMAND = 'pnpm i -D @plumeria/core';

const External = () => (
  <svg classStyle={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

export const Card = () => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(COMMAND).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <main classStyle={styles.canvas}>
      <article classStyle={styles.card}>
        <div classStyle={styles.heading}>
          <img classStyle={styles.logo} src="/logo.svg" alt="" width={28} height={28} />
          <p classStyle={styles.eyebrow}>PLUMERIA</p>
        </div>
        <h1 classStyle={styles.title}>Rust-based CSS compiler</h1>
        <p classStyle={styles.description}>
          Atomic CSS at build time, nothing at runtime.
          <br />
          Edit any style and watch it land live.
        </p>
        <button classStyle={styles.install} type="button" onClick={copy}>
          <code classStyle={styles.command}>
            <span classStyle={styles.prompt}>$</span> {COMMAND}
          </code>
          <span classStyle={[styles.copy, copied && styles.copied]}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
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
};

const styles = css.create({
  canvas: {
    position: 'fixed',
    inset: 0,
    display: 'grid',
    padding: 24,
    overflow: 'auto',
    background: theme.canvas,
    [breakpoints.sm]: {
      padding: 16,
    },
  },
  card: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: 420,
    padding: tokens.space,
    margin: 'auto',
    color: theme.text,
    background: theme.surface,
    borderColor: theme.border,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: tokens.radius,
    boxShadow: theme.shadow,
    ...css.marker('card', ':hover'),
    [breakpoints.sm]: {
      padding: 22,
      borderRadius: 20,
    },
  },
  heading: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    transition: 'rotate 500ms cubic-bezier(0.2, 0.8, 0.2, 1), scale 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    [css.extended('card', ':hover')]: {
      rotate: '36deg',
      scale: 1.1,
    },
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: theme.accent,
    letterSpacing: '0.12em',
    transition: 'letter-spacing 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    [css.extended('card', ':hover')]: {
      letterSpacing: '0.24em',
    },
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    [breakpoints.sm]: {
      fontSize: 24,
    },
  },
  description: {
    margin: '14px 0 24px',
    fontSize: 15,
    lineHeight: 1.6,
    color: theme.muted,
    textWrap: 'balance',
  },
  install: {
    boxSizing: 'border-box',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '11px 14px',
    marginBottom: tokens.gap,
    color: theme.text,
    cursor: 'pointer',
    background: theme.canvas,
    borderColor: theme.border,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: tokens.pill,
    transition: 'scale 120ms',
    ':active': {
      scale: 0.99,
    },
    ':focus-visible': {
      outline: \`2px solid \${theme.accent}\`,
      outlineOffset: 3,
    },
  },
  command: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  prompt: {
    color: theme.muted,
    transition: 'color 300ms',
    [css.extended('card', ':hover')]: {
      color: theme.accent,
    },
  },
  copy: {
    flex: 'none',
    fontSize: 12,
    fontWeight: 500,
    color: theme.muted,
  },
  copied: {
    color: theme.accent,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.gap,
  },
  button: {
    boxSizing: 'border-box',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: theme.text,
    textDecoration: 'none',
    background: theme.tint,
    borderRadius: tokens.pill,
    transition: 'scale 120ms',
    ...css.marker('button', ':hover'),
    ':active': {
      scale: 0.98,
    },
    ':focus-visible': {
      outline: \`2px solid \${theme.accent}\`,
      outlineOffset: 3,
    },
  },
  primary: {
    color: theme.onAccent,
    background: theme.accent,
  },
  icon: {
    transition: 'translate 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    [css.extended('button', ':hover')]: {
      translate: '3px -3px',
    },
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

export const breakpoints = css.createStatic({
  sm: '@media (max-width: 480px)',
});
`,
  },
];

const MERGE_FILES: SampleFile[] = [
  {
    path: ENTRY,
    label: 'Page.tsx',
    source: `import * as css from '@plumeria/core';
import { Badge } from './Badge';
import { shared } from './shared';
import { theme } from './theme';
import { breakpoints } from './tokens';

// The last style written wins, whichever file it comes from.
// Swap the entries of any array and the preview follows.

export const Page = () => (
  <main classStyle={styles.canvas}>
    <article classStyle={styles.card}>
      <h1 classStyle={styles.title}>The last style written wins</h1>
      <p classStyle={styles.lead}>Swap any array in Page.tsx and the result follows.</p>

      {/* muted comes from another module, accent from this one */}
      <section classStyle={styles.section}>
        <h2 classStyle={styles.label}>Across modules</h2>
        <div classStyle={styles.pair}>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>muted → accent</span>
            <span classStyle={[styles.specimen, shared.muted, styles.accent]}>Aa</span>
          </div>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>accent → muted</span>
            <span classStyle={[styles.specimen, styles.accent, shared.muted]}>Aa</span>
          </div>
        </div>
      </section>

      {/* Badge applies its own muted color first, then the style it receives */}
      <section classStyle={styles.section}>
        <h2 classStyle={styles.label}>Through a prop</h2>
        <div classStyle={styles.pair}>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>Badge</span>
            <Badge>Badge</Badge>
          </div>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>Badge → accent</span>
            <Badge classStyle={styles.accent}>Badge</Badge>
          </div>
        </div>
      </section>

      {/* The accent band is the padding: the longhand outranks its shorthand in either order */}
      <section classStyle={styles.section}>
        <h2 classStyle={styles.label}>Longhand over shorthand</h2>
        <div classStyle={styles.trio}>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>box</span>
            <div classStyle={styles.box}>
              <div classStyle={styles.fill} />
            </div>
          </div>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>box → top</span>
            <div classStyle={[styles.box, styles.boxTop]}>
              <div classStyle={styles.fill} />
            </div>
          </div>
          <div classStyle={styles.tile}>
            <span classStyle={styles.caption}>top → box</span>
            <div classStyle={[styles.boxTop, styles.box]}>
              <div classStyle={styles.fill} />
            </div>
          </div>
        </div>
      </section>
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
    [breakpoints.sm]: {
      padding: 16,
    },
  },
  card: {
    boxSizing: 'border-box',
    display: 'grid',
    gap: 24,
    width: '100%',
    maxWidth: 480,
    padding: 28,
    margin: 'auto',
    color: theme.text,
    background: theme.surface,
    borderColor: theme.border,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: 24,
    boxShadow: theme.shadow,
    [breakpoints.sm]: {
      gap: 20,
      padding: 20,
      borderRadius: 20,
    },
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },
  lead: {
    margin: '-16px 0 0',
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.muted,
  },
  section: {
    display: 'grid',
    gap: 10,
  },
  label: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  pair: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  trio: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
  },
  tile: {
    display: 'grid',
    gap: 12,
    justifyItems: 'start',
    padding: 14,
    borderColor: theme.border,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: 14,
    [breakpoints.sm]: {
      padding: 10,
    },
  },
  caption: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    color: theme.muted,
  },
  specimen: {
    fontSize: 32,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  accent: {
    color: theme.accent,
  },
  box: {
    boxSizing: 'border-box',
    width: '100%',
    padding: 8,
    background: theme.accent,
    borderRadius: 10,
  },
  boxTop: {
    paddingTop: 32,
  },
  fill: {
    height: 20,
    background: theme.surface,
    borderRadius: 4,
  },
});
`,
  },
  {
    path: '/Badge.tsx',
    label: 'Badge.tsx',
    source: `import * as css from '@plumeria/core';
import { theme } from './theme';

type BadgeProps = {
  classStyle?: css.StyleProps<'color'>;
  children: string;
};

export const Badge = ({ classStyle, children }: BadgeProps) => (
  <span classStyle={[styles.badge, classStyle]}>{children}</span>
);

const styles = css.create({
  badge: {
    padding: '6px 12px',
    fontSize: 14,
    fontWeight: 600,
    color: theme.muted,
    background: theme.tint,
    borderRadius: 999,
  },
});
`,
  },
  {
    path: '/shared.ts',
    label: 'shared.ts',
    source: `import * as css from '@plumeria/core';
import { theme } from './theme';

export const shared = css.create({
  muted: {
    color: theme.muted,
  },
});
`,
  },
  SAMPLE_FILES[1],
  SAMPLE_FILES[2],
];

export type ExampleName = 'card' | 'merge';

export const EXAMPLES: Record<ExampleName, SampleFile[]> = {
  card: SAMPLE_FILES,
  merge: MERGE_FILES,
};

export function exampleFromSearch(search: string): ExampleName {
  const name = new URLSearchParams(search).get('example');
  return name && Object.hasOwn(EXAMPLES, name) ? (name as ExampleName) : 'card';
}
