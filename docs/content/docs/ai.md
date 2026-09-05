---
title: AI.md
description: System instructions and mental models for AI assistants working with Plumeria.
---

This document is for AI assistants (Claude, Gemini, ChatGPT, and others) generating code with Plumeria. When writing Plumeria code, **always** follow the rules and patterns described here.

## Critical Rules (Quick Reference)

The complete rule set, distilled. Each rule is explained with examples in the sections below.

**MUST:**

- Call `css.create()` at module top level, never inside a component. (→ Forbidden Patterns)
- Bind styles with the `classStyle` prop, not `className`. (→ Mental Model)
- Import `@plumeria/core` in every file that uses Plumeria styles, including files that only consume imported styles. (→ Core Usage)
- Start nested selector keys with `:` (pseudo) or `[` (attribute). (→ Selector Rules)
- Explicitly declare a compound selector when simultaneous pseudo-class states set the same property. (→ Selector Rules)
- Compose with arrays; the right side always wins. (→ Core Usage)

**NEVER:**

- Pass a raw object to `classStyle`, e.g. `classStyle={{ color: 'red' }}`. (→ Forbidden Patterns)
- Call `css.create()` inside a component body. (→ Forbidden Patterns)
- Use the `&` self-reference character. (→ Selector Rules)
- Use `:has()`, `:is()`, or `:where()` — use `css.marker()` / `css.extended()` instead. (→ Selector Rules, Advanced APIs)
- Use child or descendant selectors (`.title`, `> div`) — style child elements directly. (→ Selector Rules)
- Nest a media/container query inside a pseudo-selector. The reverse (pseudo inside media) is allowed once. (→ Selector Rules)
- Mix `className` and `classStyle` on the same element. (→ Forbidden Patterns)
- Merge `css.use()` output with the inline `style` prop. (→ Dynamic Styling)
- Route a function key through `css.use()`, inline or through a `Style` prop. (→ Dynamic Styling)
- Pass a received `Style` prop on to another component. Apply it on the element the component renders. (→ Styling Custom Components)

## Mental Model

AI assistants often misapply runtime CSS-in-JS habits to Plumeria. Correct your mental model:

- **Styles are type schemas, not runtime objects.** Plumeria definitions are static schemas read by the compiler; they do not exist as JavaScript objects at runtime.
- **`css.create()` is a compiler directive, not an object factory.** Everything inside it is statically analyzed — the compiler must be able to read all styling information without executing code.
- **`classStyle` is NOT `className`.** Plumeria binds styles through its own `classStyle` prop. Never reach for `className` reflexively.
- **Zero-byte CSS in the JS bundle.** All CSS is resolved at build time. The abstraction layer (your definitions) and the output layer (generated CSS) are completely separated, so Plumeria has no side effects and high referential transparency.

## Core Usage

Define styles at module top level with `css.create()`, bind them with `classStyle`:

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
    <div classStyle={[styles.container, isActive && styles.active]}>
      Hello Plumeria
    </div>
  );
};
```

**Right-wins composition.** `classStyle` accepts arrays, ternaries, and conditional expressions. The right-most style always takes precedence: above, `styles.active` overrides `styles.container` when `isActive` is true. `css.use()` follows the same rule. Within a single style, do not rely on source order to resolve overlapping pseudo-class states; declare their compound selector explicitly (see Selector Rules).

**Cross-file imports.** Styles can be imported across files, but the consuming component file MUST contain `import "@plumeria/core";` — the import is how the compiler finds the file.

## Forbidden Patterns

Never generate these patterns. They break static analysis or cause runtime errors.

❌ **Passing an object directly to `classStyle`:**

```tsx
<span classStyle={{ fontSize: '12px' }}>Small Text</span>
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

❌ **Mixing `className` and `classStyle` on the same element:**

```tsx
<span className="global-class" classStyle={styles.base}>Text</span>
```

❌ **Complex JS expressions in style values.** Only simple ternary operators are allowed, and only when necessary. Never put complex logic or function calls inside style values.

## Selector Rules

Plumeria supports nesting for pseudo-classes, pseudo-elements, and attribute selectors — under strict rules:

- **NO `&`.** Plumeria does not use the `&` self-reference character.
- **Nested keys MUST start with `:` or `[`.** Pseudo-classes/elements start with `:`; attribute selectors start with `[`.
- **NO `:has()`, `:is()`, `:where()`.** These are strictly forbidden. Use the paired `css.marker()` / `css.extended()` APIs (see Advanced APIs) for context-aware, parent-state, or descendant styling — they cover every use case of these pseudo-classes without breaking CSS atomicity.
- **NO child selectors.** Keys like `.title` or `> div` are not supported. Apply Plumeria styles directly to child elements instead.
- **Declare overlapping states explicitly.** Pseudo-classes such as `:hover`, `:focus`, and `:active` can match simultaneously. When two states set the same property, declare their compound selector with the value the intersection should take. If they set different properties, no compound selector is needed.
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
    ':active': {
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    },
    // ✅ :hover and :active can match together; the intersection gets its own value
    ':hover:active': {
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
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

// Usage: <div classStyle={styles.palette(color)} />
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
  return <button classStyle={sizeStyles[size]}>{children}</button>;
};
```

Best practices:

- ⚠️ **Keep variant `css.create()` calls minimal.** Every key in a `css.create()` used with bracket notation is compiled into the generated lookup table (e.g. `{"small":"...","medium":"..."}[size]`). Separate variants into dedicated calls; don't mix them with unrelated static styles.
- **Local variable assignment is supported.** `const currentStyle = sizeStyles[size]; <div classStyle={currentStyle} />` works — the compiler traces local style variables and inlines them during JSX extraction.

### `css.use()` returns a static string

`css.use()` compiles to a static class name string. It has **no** integration with the inline `style` prop — never attempt to merge or combine `css.use()` output with `style`. A function key cannot go through it, inline or through a `Style` prop: the value reaches the element as a CSS variable on `style`, which `css.use()` never sets.

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
    <div classStyle={styles.parent}>
      <span classStyle={styles.child}>Hover parent to make me blue!</span>
    </div>
  );
};
```

At build time this compiles to an atomic container style query (`@container style(--x1f9k2q1-card-hover: 1)`) — zero runtime overhead, zero dependency on DOM hierarchy.

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

There are exactly **3 patterns** for applying Plumeria styles to custom components. In all of them, compilation happens at the `classStyle` / `css.use()` call sites; the component itself just passes the compiled `className` / `style` through to the DOM.

> **Core principle**: Custom props typed as `Style` are statically traced by the compiler, so styles pass seamlessly across component boundaries.

### Pattern 1: Direct `classStyle` inside the component

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
    // The compiler transforms classStyle → className here
    <button classStyle={styles.button}>
      {children}
    </button>
  );
};

// Usage
<Button>Click me</Button>;
```

### Pattern 2: Passing a `Style` prop

`classStyle` itself is compiled away at the call site, so it cannot be used as a prop name on a custom component. Instead, define a custom prop (e.g. `styleArray`) typed as `css.Style`. The compiler statically traces it across component boundaries and resolves it into the internal element's `classStyle`. Composing as `[styles.text, styleArray]` lets call-site styles override the component's base styles (right-wins — see Core Usage): below, the call site's `fontSize: '24px'` overrides the internal `fontSize: '12px'`.

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArray?: css.Style;
};

// base style
const styles = css.create({
  text: {
    fontSize: '12px',
  },
});

// Pass styleArray directly to the inner element's classStyle
export const Button = ({ children, styleArray }: ButtonProps) => {
  return <button classStyle={[styles.text, styleArray]}>{children}</button>;
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

The component resolves the `Style` prop into a class name string with `css.use()` and passes it to `className`. The compiler traces the prop into the `css.use()` call the same way:

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArray?: css.Style;
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

This pattern cannot carry a function key. The call site's value reaches the element as a CSS variable, and `css.use()` returns a class name with nowhere to put it:

```tsx
// ❌ INVALID: palette is a function key, so its variable has no element to land on
<Button styleArray={styles.palette(color)}>Click me</Button>;
```

```
Plumeria: "styleArray" carries a dynamic function key, and css.use() returns
only a class name. Apply it to classStyle on the element instead.
```

Use Pattern 2 for a prop that may carry one: `classStyle` sets the variable next to the class.

### Anti-pattern: relaying a `Style` prop

A component that receives a `Style` prop MUST apply it — to `classStyle` or through `css.use()` — on an element it renders. A style prop that is never applied is a build error, which is what happens when it is handed to another component instead.

What decides this is **where the style ends up**, not how many style props a component takes. Passing styles in is always fine:

```tsx
// ✅ VALID: every value is a style, so any number of style props is fine
<Layout
  headerStyle={styles.header}
  bodyStyle={styles.body}
  buttonStyle={styles.button}
/>
```

Forwarding one onward instead of applying it is not:

```tsx
// ❌ INVALID: headerStyle reaches no element of this component
export const Layout = ({ headerStyle }: { headerStyle?: css.Style }) => {
  return <Header headerStyle={headerStyle} />;
};
```

```
Plumeria: "headerStyle" is a style received through a prop but is never applied
to classStyle or css.use() here. Apply it on an element this component renders;
a style prop cannot be passed on to another component.
```

Write one of these instead:

```tsx
// ✅ Apply it on an element this component renders
export const Layout = ({ headerStyle }: { headerStyle?: css.Style }) => {
  return <header classStyle={[styles.base, headerStyle]}>...</header>;
};

// ✅ Or drop the middle component and style the one that owns the element
<Header headerStyle={[styles.base, styles.primary]} />;
```

Merging under a base style — `[styles.base, headerStyle]` — is the supported shape. What is rejected is the *relay*: a prop that is only forwarded, never applied.

So the valid call site above stays valid only while `Layout` applies all three props itself. If it routes them onward to a grandchild, each unapplied prop is an error — which is the signal that the styles belong on the components that own those elements.

Prop drilling is an anti-pattern in React on its own terms; here it is also unresolvable, because the compiler would have to trace a style across an arbitrary chain of wrappers to build the lookup table. Rejecting it keeps the boundary decidable and the generated CSS exact.

### Summary

| Pattern | Compilation site | Component's role |
|---------|-----------------|-----------------|
| 1. Direct `classStyle` | Inside the component | Self-contained styles |
| 2. `Style` prop | Traced and compiled | Receives and applies `Style` |
| 3. `className` bypass | Inside the component (`css.use`) | Resolves `Style` into `className` |

In every pattern the component **applies** the style it receives. None of them forward it.

## Migrating from Tailwind CSS

Tailwind's model and Plumeria's do not map one-to-one. A utility-by-utility rewrite produces code that fails to compile, silently breaks, or reads like Tailwind reimplemented. Migrate one component at a time, under three rules.

**Resolve values from the compiled stylesheet, never from memory.** Utility values come from the project's `@theme`, not from a fixed table: `p-4` is `calc(var(--spacing) * 4)`, `text-sm` sets `font-size` *and* a paired `line-height`, and the color scale is whatever the project defines. Build the project and read the declarations out of the emitted CSS.

**NEVER carry a `--tw-*` variable chain across.** `shadow-lg` compiles to `--tw-shadow: …` plus `box-shadow: var(--tw-inset-shadow), …, var(--tw-shadow)`, and those variables hold a value only because Tailwind registers them with `@property`. Copied literally, the declaration is invalid and the shadow disappears. Resolve the chain to its final value instead.

**Name keys after what the element is, not after the utilities it carried.** The class list is the input to the migration, not the output.

```tsx
// ❌ Tailwind reimplemented — these names carry no more meaning than the class list did
const styles = css.create({
  hoverBgBlue500: { ':hover': { backgroundColor: '#3b82f6' } },
  px4: { paddingInline: '1rem' },
});

// ✅ One key per thing the component has
const styles = css.create({
  submitButton: {
    paddingInline: '1rem',
    backgroundColor: '#2563eb',
    ':hover': { backgroundColor: '#3b82f6' },
  },
});
```

**Three variants need restructuring rather than translation.** Breakpoints (`md:`) and `data-*` variants map directly, to `@media` and attribute-selector keys. `dark:` depends on the project: it is `@media (prefers-color-scheme: dark)` by default, but `@custom-variant dark` commonly redefines it as a `.dark` class selector — which belongs in the restructuring set below, not the direct one. Check the compiled output before assuming which.

| Tailwind | Compiles to | Write instead |
|---|---|---|
| `hover:`, `focus:` | `&:hover { @media (hover: hover) { … } }` | `':hover': { … }`, dropping the `@media (hover: hover)` wrapper — Plumeria forbids a query inside a pseudo. The styles then apply on touch devices too. |
| `group-*`, `peer-*` | `&:is(:where(.group):hover *)` | `css.marker()` on the parent and `css.extended()` on the descendant. The `.group` / `.peer` class disappears. |
| `space-x-*`, `divide-*` | `:where(& > :not(:last-child))` | The margin or border applied to the children directly — Plumeria has no child selectors. |

### `tv()` and `twMerge()`

| Tailwind Variants | Plumeria |
|---|---|
| `base` | Static keys in the component's own `css.create()` |
| `variants` | One dedicated `css.create()` per variant group, read with bracket notation (keep these calls minimal — see Bracket notation) |
| `defaultVariants` | Default parameter values |
| `compoundVariants` | An explicit condition in the `classStyle` array |
| `slots` | One `css.create()` per element, not one call carrying every slot |

**An external `className` override becomes a `Style` prop, not a `className`.** `twMerge(button(...), className)` exists to let the call site win; Pattern 2 does the same job, because array position is right-wins. **NEVER** resolve the override away, force it through `css.use()`, or change the component's public API to avoid the mixing rule.

**NEVER guess a class name that was built at runtime.** A template literal or a value read from props or state is not statically knowable. Leave the component on Tailwind and report it; a guessed utility compiles and is silently wrong.

```tsx
// --- Before ---
const button = tv({
  base: 'inline-flex rounded font-medium',
  variants: {
    size: { sm: 'h-8 px-3 text-sm', lg: 'h-12 px-6 text-lg' },
    tone: { primary: 'bg-blue-500 text-white', danger: 'bg-red-500 text-white' },
  },
  compoundVariants: [{ size: 'lg', tone: 'primary', class: 'shadow-lg' }],
  defaultVariants: { size: 'sm', tone: 'primary' },
});

<button className={twMerge(button({ size, tone }), className)} />;

// --- After (values resolved from the project's compiled CSS, not recalled) ---
const styles = css.create({
  base: { display: 'inline-flex', borderRadius: '4px', fontWeight: 500 },
  lgPrimary: { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
});

const sizeStyles = css.create({
  sm: { height: '32px', paddingInline: '12px', fontSize: '14px' },
  lg: { height: '48px', paddingInline: '24px', fontSize: '18px' },
});

const toneStyles = css.create({
  primary: { backgroundColor: '#3b82f6', color: '#fff' },
  danger: { backgroundColor: '#ef4444', color: '#fff' },
});

type ButtonProps = {
  size?: keyof typeof sizeStyles;
  tone?: keyof typeof toneStyles;
  styleArray?: css.Style;
};

export const Button = ({ size = 'sm', tone = 'primary', styleArray }: ButtonProps) => (
  <button
    classStyle={[
      styles.base,
      sizeStyles[size],
      toneStyles[tone],
      size === 'lg' && tone === 'primary' && styles.lgPrimary,
      styleArray,
    ]}
  />
);
```

## Testing

**NEVER stub `@plumeria/core`.** It publishes types and no runtime. A `moduleNameMapper` entry or a hand-written mock makes the suite run, but every class name it produces is invented, so the test says nothing about the styles. If a runner cannot resolve the package, that is the signal to test a different layer, not to fake the package.

**NEVER assert a generated class name in a component test.** `xvdv6o3r` is one property-value pair, hashed. Adding a property to the style breaks every test that spelled the old list out. Assert what the component renders, holds, or branches on.

**To test what a style compiles to, call the transform directly.** It takes a source string and returns the rewritten code plus the stylesheet — no component, no DOM, no bundler. Write it for Jest; Vitest and `node:test` need their own imports, and `node:test` has no `expect` at all.

For a project on `@plumeria/unplugin`:

```js
const { unpluginFactory } = require('@plumeria/unplugin/factory');

const plugin = unpluginFactory();
const { code } = await plugin.transform(source, id);

const cssId = code.match(/import "(.+\.zero\.css)"/)[1];
const css = plugin.load(cssId);
```

For a project on `@plumeria/next-plugin`, call the loader its build runs, with a loader context of your own:

```js
const loader = require('@plumeria/turbopack-loader');
const fn = loader.default ?? loader;

const compile = (source) =>
  new Promise((resolve, reject) => {
    fn.call(
      {
        resourcePath: `${__dirname}/fixture.tsx`,
        async: () => (err, content) => (err ? reject(err) : resolve(content)),
        addDependency: () => {},
        clearDependencies: () => {},
      },
      source,
    );
  });
```

The loader returns the rewritten code and writes its stylesheet only when `NODE_ENV` is `development` or `production`; a test run is neither, so the file is left alone. Read class names from the returned code and derive them; do not hard-code them.

**To test component behaviour, use Vitest with the plugin in the config.** This is the only layer that needs the transform in the module pipeline.

```ts
export default defineConfig({
  plugins: [react(), plumeria.vite()],
  test: { environment: 'jsdom' },
});
```

**jsdom applies no stylesheet.** `document.styleSheets` is empty and `getComputedStyle` returns initial values. A test there can see which classes were attached, never what they do. Anything about the cascade — specificity, `@media`, `marker` with `extended` — belongs in an end-to-end test against a real browser.

## Toolchain Notes

**Compiler expectations.** The SWC compiler statically extracts `css.create()` calls, which is why they MUST sit at module top level. Prefer direct, clearly defined references — indirect variable references may be unanalyzable.

**ESLint guarantees.** `@plumeria/eslint-plugin` strictly enforces Plumeria's rules; code that satisfies it is safe to ship. It guarantees:

- **CSS property value validation** — invalid values are caught at lint time.
- **Property sort order** — a specific ordering is enforced.
- **Unused style detection** — unused styles are flagged automatically.

Follow the plugin's rules as documented in its `README.md`.
