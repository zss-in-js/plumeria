---
title: AI.md
description: System instructions and mental models for AI assistants working with Plumeria.
---

This document is for AI assistants (Claude, Gemini, ChatGPT, and others) generating code with Plumeria. When writing Plumeria code, **always** follow the rules and patterns described here.

## Critical Rules (Quick Reference)

The complete rule set, distilled. Each rule is explained with examples in the sections below.

**MUST:**

- Call `css.create()` at module top level, never inside a component. (→ Forbidden Patterns)
- Bind styles with the `styleName` prop, not `className`. (→ Mental Model)
- Import `@plumeria/core` in every file that uses Plumeria styles, including files that only consume imported styles. (→ Core Usage)
- Start nested selector keys with `:` (pseudo) or `[` (attribute). (→ Selector Rules)
- Compose with arrays; the right side always wins. (→ Core Usage)

**NEVER:**

- Pass a raw object to `styleName`, e.g. `styleName={{ color: 'red' }}`. (→ Forbidden Patterns)
- Call `css.create()` inside a component body. (→ Forbidden Patterns)
- Use the `&` self-reference character. (→ Selector Rules)
- Use `:has()`, `:is()`, or `:where()` — use `css.marker()` / `css.extended()` instead. (→ Selector Rules, Advanced APIs)
- Use child or descendant selectors (`.title`, `> div`) — style child elements directly. (→ Selector Rules)
- Nest a media/container query inside a pseudo-selector. The reverse (pseudo inside media) is allowed once. (→ Selector Rules)
- Mix `className` and `styleName` on the same element. (→ Forbidden Patterns)
- Merge `css.use()` output with the inline `style` prop. (→ Dynamic Styling)

## Mental Model

AI assistants often misapply runtime CSS-in-JS habits to Plumeria. Correct your mental model:

- **Styles are type schemas, not runtime objects.** Plumeria definitions are static schemas read by the compiler; they do not exist as JavaScript objects at runtime.
- **`css.create()` is a compiler directive, not an object factory.** Everything inside it is statically analyzed — the compiler must be able to read all styling information without executing code.
- **`styleName` is NOT `className`.** Plumeria binds styles through its own `styleName` prop. Never reach for `className` reflexively.
- **Zero-byte CSS in the JS bundle.** All CSS is resolved at build time. The abstraction layer (your definitions) and the output layer (generated CSS) are completely separated, so Plumeria has no side effects and high referential transparency.

## Core Usage

Define styles at module top level with `css.create()`, bind them with `styleName`:

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  container: {
    display: 'flex',
    padding: '16px',
  },
  active: {
    backgroundColor: 'blue',
  },
});

export const MyComponent = ({ isActive }) => {
  return (
    <div styleName={[styles.container, isActive && styles.active]}>
      Hello Plumeria
    </div>
  );
};
```

**Right-wins composition.** `styleName` accepts arrays, ternaries, and conditional expressions. The right-most style always takes precedence: above, `styles.active` overrides `styles.container` when `isActive` is true. `css.use()` follows the same rule. Specificity is always 1 — there are no specificity collisions, and "right side wins" is the only rule you need.

**Cross-file imports.** Styles can be imported across files, but the consuming component file MUST contain `import "@plumeria/core";` — the import is how the compiler finds the file.

## Forbidden Patterns

Never generate these patterns. They break static analysis or cause runtime errors.

❌ **Passing an object directly to `styleName`:**

```tsx
<span styleName={{ fontSize: '12px' }}>Small Text</span>
```

❌ **Creating styles inside a component body:**

```tsx
export const BadComponent = ({ dynamicColor }) => {
  const dynamicStyles = css.create({
    dynamic: { color: dynamicColor },
  });
  // ...
};
```

❌ **Mixing `className` and `styleName` on the same element:**

```tsx
<span className="global-class" styleName={styles.base}>Text</span>
```

❌ **Complex JS expressions in style values.** Only simple ternary operators are allowed, and only when necessary. Never put complex logic or function calls inside style values.

## Selector Rules

Plumeria supports nesting for pseudo-classes, pseudo-elements, and attribute selectors — under strict rules:

- **NO `&`.** Plumeria does not use the `&` self-reference character.
- **Nested keys MUST start with `:` or `[`.** Pseudo-classes/elements start with `:`; attribute selectors start with `[`.
- **NO `:has()`, `:is()`, `:where()`.** These are strictly forbidden. Use the paired `css.marker()` / `css.extended()` APIs (see Advanced APIs) for context-aware, parent-state, or descendant styling — they cover every use case of these pseudo-classes without breaking CSS atomicity.
- **NO child selectors.** Keys like `.title` or `> div` are not supported. Apply Plumeria styles directly to child elements instead.
- **Media/container query nesting is one-directional.** A pseudo-selector may be nested inside a media/container query exactly once. The reverse — a media/container query inside a pseudo-selector — is forbidden and causes compiler/type errors.

```tsx
const styles = css.create({
  button: {
    backgroundColor: 'white',
    padding: '16px',

    // ✅ Pseudo-classes and elements (starts with :)
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '::before': {
      content: '""',
      display: 'block',
    },

    // ✅ Attribute selectors (starts with [)
    '[data-active="true"]': {
      border: '2px solid blue',
    },

    // ✅ Pseudo-selector nested inside a media query (allowed once)
    '@media (max-width: 768px)': {
      padding: '8px',
      ':hover': {
        boxShadow: 'none',
      },
    },
  },
});

// ❌ INVALID: media query nested inside a pseudo-selector
const badStyles = css.create({
  button: {
    ':hover': {
      '@media (max-width: 768px)': {
        backgroundColor: 'blue',
      },
    },
  },
});
```

## Dynamic Styling

### Function keys

For dynamic values (which would normally require React's inline `style` prop), define a **function key** in `css.create()`. Function keys compile to CSS variables — so unlike inline styles, they fully support `@media` and `@container` queries:

```tsx
const styles = css.create({
  palette: (color: string) => ({
    backgroundColor: color,
    // Media/container queries work on dynamic styles
    '@media (max-width: 600px)': {
      backgroundColor: 'blue',
    },
  }),
});

// Usage: <div styleName={styles.palette(color)} />
```

### Bracket notation (variants)

The `css.variants()` API has been removed in favor of standard bracket notation (`styles[variant]`). The compiler turns these expressions into static lookup tables at build time:

```tsx
import * as css from '@plumeria/core';

// 1. Define variants in a dedicated, minimal css.create()
const sizeStyles = css.create({
  small: { fontSize: '12px' },
  medium: { fontSize: '16px' },
  large: { fontSize: '20px' },
});

// 2. Type the variant (string literal union or keyof typeof)
type Size = keyof typeof sizeStyles;

interface ButtonProps {
  size: Size;
  children: React.ReactNode;
}

// 3. Resolve dynamically with bracket notation
export const Button = ({ size, children }: ButtonProps) => {
  return <button styleName={sizeStyles[size]}>{children}</button>;
};
```

Best practices:

- ⚠️ **Keep variant `css.create()` calls minimal.** Every key in a `css.create()` used with bracket notation is compiled into the generated lookup table (e.g. `{"small":"...","medium":"..."}[size]`). Separate variants into dedicated calls; don't mix them with unrelated static styles.
- **Local variable assignment is supported.** `const currentStyle = sizeStyles[size]; <div styleName={currentStyle} />` works — the compiler traces local style variables and inlines them during JSX extraction.

### `css.use()` returns a static string

`css.use()` compiles to a static class name string. It has **no** integration with the inline `style` prop — never attempt to merge or combine `css.use()` output with `style`.

## Advanced APIs

### `css.marker()` and `css.extended()` (paired descendant styling)

These paired APIs enable context-aware styling (e.g. styling a child when the parent is hovered) without DOM combinators or `:has()`/`:is()`/`:where()`:

- **`css.marker(id, pseudo)`** — sets a CSS variable marker on the parent when the pseudo state is active. MUST be spread into the parent style: `...css.marker(...)`.
- **`css.extended(id, pseudo)`** — applies styles to descendants while the linked marker is active. Used as a computed key: `[css.extended(...)]`.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  parent: {
    // 1. Set a marker with the unique id 'card' for the ':hover' state
    ...css.marker('card', ':hover'),
    padding: '24px',
    border: '1px solid #ccc',
  },
  child: {
    transition: 'color 0.3s ease',
    // 2. React to the 'card' marker being active
    [css.extended('card', ':hover')]: {
      color: 'blue',
      // Further pseudo-classes can be nested here
      ':hover': {
        color: 'darkblue',
      },
    },
  },
});

export const Card = () => {
  return (
    <div styleName={styles.parent}>
      <span styleName={styles.child}>Hover parent to make me blue!</span>
    </div>
  );
};
```

At build time this compiles to an atomic container style query (`@container style(--card-hover: 1)`) — zero runtime overhead, zero dependency on DOM hierarchy.

### `css.createStatic()`

Defines static variables (such as media query strings) that are inlined at build time, typically used as computed keys in `css.create()`:

```tsx
import * as css from '@plumeria/core';

export const breakpoints = css.createStatic({
  xs: '@media (max-width: 480px)',
  sm: '@media (max-width: 640px)',
  md: '@media (max-width: 768px)',
  lg: '@media (max-width: 1024px)',
});

export const styles = css.create({
  container: {
    [breakpoints.sm]: {
      padding: 16,
    },
    [breakpoints.lg]: {
      padding: 32,
    },
  },
});
```

### `css.createTheme()`

Defines scoped CSS variables for themes. First argument: the selector that activates the theme. Second argument: an object of `{ default, theme }` value pairs. Generated variable names are prefixed with a unique hash, so name collisions are impossible. Theme values are only compiled when actually used in a styling block.

```tsx
import * as css from '@plumeria/core';

// Class-based theme
export const theme = css.createTheme('.dark', {
  text: {
    default: '#333',
    theme: '#eaeaea',
  },
  background: {
    default: 'white',
    theme: 'black',
  },
});

// Attribute selectors and media queries are also supported:
// css.createTheme('[data-theme="dark"]', { ... });
// css.createTheme('@media (prefers-color-scheme: dark)', { ... });
```

### `css.keyframes()`

Generates a unique `@keyframes` animation name (a hash inlined at build time) for use inside style rules:

```tsx
import * as css from '@plumeria/core';

const fadeIn = css.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const styles = css.create({
  card: {
    transition: 'transform 0.3s ease',
    ':hover': {
      animationName: fadeIn,
      animationDuration: '0.5s',
    },
  },
});
```

### `css.viewTransition()`

Generates a unique `view-transition-name`, accepting animation definitions (`group`, `imagePair`, `new`, `old`) to customize View Transitions:

```tsx
import * as css from '@plumeria/core';

const fadeIn = css.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const longCrossFade = css.viewTransition({
  old: {
    animationName: fadeOut,
    animationDuration: '1.2s',
  },
  new: {
    animationName: fadeIn,
    animationDuration: '1.2s',
  },
});

export const transition = css.create({
  name: {
    viewTransitionName: longCrossFade,
  },
});

// React usage:
// <ViewTransition name={css.use(transition.name)}>...</ViewTransition>
```

## Styling Custom Components

There are exactly **3 patterns** for applying Plumeria styles to custom components. In all of them, compilation happens at the `styleName` / `css.use()` call sites; the component itself just passes the compiled `className` / `style` through to the DOM.

> **Core principle**: Custom props typed as `StyleName` are statically traced by the compiler, so styles pass seamlessly across component boundaries.

### Pattern 1: Direct `styleName` inside the component

The component imports its own styles and applies them internally. Simplest pattern — fully self-contained:

```tsx
import React from 'react';
import * as css from '@plumeria/core';

const styles = css.create({
  button: {
    padding: '10px',
    backgroundColor: 'navy',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
});

export const Button = ({ children }: { children: React.ReactNode }) => {
  return (
    // The compiler transforms styleName → className here
    <button styleName={styles.button}>
      {children}
    </button>
  );
};

// Usage
<Button>Click me</Button>;
```

### Pattern 2: Passing a `StyleName` prop

`styleName` itself is compiled away at the call site, so it cannot be used as a prop name on a custom component. Instead, define a custom prop (e.g. `styleArray`) typed as `css.StyleName`. The compiler statically traces it across component boundaries and resolves it into the internal element's `styleName`. Composing as `[styles.text, styleArray]` lets call-site styles override the component's base styles (right-wins — see Core Usage): below, the call site's `fontSize: '24px'` overrides the internal `fontSize: '12px'`.

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArray?: css.StyleName;
};

// base style
const styles = css.create({
  text: {
    fontSize: '12px',
  },
});

// Pass styleArray directly to the inner element's styleName
export const Button = ({ children, styleArray }: ButtonProps) => {
  return <button styleName={[styles.text, styleArray]}>{children}</button>;
};

// --- Usage (call site) ---
import * as css from '@plumeria/core';
import { Button } from './Button';

const styles = css.create({
  primary: {
    padding: '10px',
    backgroundColor: 'navy',
    color: '#fff',
  },
  text: {
    fontSize: '24px',
  },
});

// The compiler traces styleArray and resolves it statically
<Button styleArray={[styles.primary, styles.text]}>Click me</Button>;
```

### Pattern 3: `className` bypass with `css.use()`

The component resolves the `StyleName` prop into a class name string with `css.use()` and passes it to `className`. The compiler traces the prop into the `css.use()` call the same way:

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArray?: css.StyleName;
};

// base style
const styles = css.create({
  text: {
    fontSize: '12px',
  },
});

// Pass styleArray into css.use() to generate the className
export const Button = ({ children, styleArray }: ButtonProps) => {
  return (
    <button className={css.use(styles.text, styleArray)}>
      {children}
    </button>
  );
};

// --- Usage (call site) ---
import * as css from '@plumeria/core';
import { Button } from './Button';

const styles = css.create({
  primary: {
    padding: '10px',
    backgroundColor: 'navy',
    color: '#fff',
  },
  text: {
    fontSize: '24px',
  },
});

// The compiler traces styleArray inside css.use() and resolves it statically
<Button styleArray={[styles.primary, styles.text]}>Click me</Button>;
```

### Summary

| Pattern | Compilation site | Component's role |
|---------|-----------------|-----------------|
| 1. Direct `styleName` | Inside the component | Self-contained styles |
| 2. `StyleName` prop | Traced and compiled | Receives and applies `StyleName` |
| 3. `className` bypass | Inside the component (`css.use`) | Resolves `StyleName` into `className` |

## Toolchain Notes

**Compiler expectations.** The SWC compiler statically extracts `css.create()` calls, which is why they MUST sit at module top level. Prefer direct, clearly defined references — indirect variable references may be unanalyzable.

**ESLint guarantees.** `@plumeria/eslint-plugin` strictly enforces Plumeria's rules; code that satisfies it is safe to ship. It guarantees:

- **CSS property value validation** — invalid values are caught at lint time.
- **Property sort order** — a specific ordering is enforced.
- **Unused style detection** — unused styles are flagged automatically.

Follow the plugin's rules as documented in its `README.md`.
