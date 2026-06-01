---
title: AI.md
description: System instructions and mental models for AI assistants working with Plumeria.
---

# Plumeria for AI Assistants

This document is designed for AI assistants (like Claude, Gemini, ChatGPT) to understand the core concepts, mental models, and strictly forbidden patterns when writing code with Plumeria.

When generating Plumeria code, **always** adhere to the rules and patterns described here.

## Philosophy

To understand Plumeria, you must internalize its primary existence reason:

- **Styles are "Type Schemas", not Runtime Objects**: Plumeria definitions are static schemas that the compiler understands. They are not Javascript objects that exist at runtime.
- **Complete Separation of Abstraction and Output**: The abstraction layer (your style definitions) and the output layer (the generated CSS) are completely separated.
- **Zero-Byte CSS in JS Bundle**: CSS is resolved entirely at build time. The JS bundle contains 0 bytes of CSS. Plumeria has no side effects, providing high referential transparency and exceptional maintainability.

## Mental Model

AI assistants often misunderstand CSS-in-JS libraries. Correct your mental model for Plumeria:

- `css.create()` **is a compiler directive, not an object creator**: It should be understood as a compiler directive rather than a traditional runtime object factory.
- `styleName` **is NOT `className`**: Plumeria uses its own custom prop `styleName` for style bindings. Never use `className` reflexively when styling with Plumeria.
- **Styles MUST be statically analyzable**: The compiler must be able to read all styling information without executing the code.
- **Static Analysis Premise**: Keep in mind that everything you write inside `css.create()` will be statically analyzed by the Plumeria compiler.

## Deterministic Composition

Traditional CSS and standard CSS-in-JS libraries can suffer from specificity issues and unpredictable merging when imported across modules. Plumeria solves this definitively.

- **The Right Side Always Wins**: When composing styles, the right-most style always takes precedence.
  - Example: `styleName={[styles.base, isActive && styles.active]}` -> `styles.active` wins if `isActive` is true.
  - The `css.use()` API follows this exact same right-wins rule.
- **Specificity is always 1**: There are no specificity collisions. You do not need to think about CSS specificity rules other than "right side wins".

## Forbidden Runtime Patterns (CRITICAL)

DO NOT generate these patterns under any circumstances. They will break the static analysis or cause runtime errors.

- ❌ **Passing objects directly to `styleName`**:
  - `styleName={{ color: 'red' }}` is absolutely forbidden.
- ❌ **Dynamically generating styles outside of `css.create()`**:
  - Styles cannot be created dynamically in component bodies.
- ❌ **Using complex JS expressions for style values**:
  - Only simple ternary operators are allowed if absolutely necessary. Avoid complex logic or function calls inside style values.
- ❌ **Mixing `className` and `styleName`**:
  - Do not use both on the same element. Use `styleName` exclusively for Plumeria styles.

## Style Composition Rules

Follow these patterns for composing styles correctly:

- **Array Composition**: `styleName={[styles.a, condition && styles.b]}`
- **Cross-file Imports**: You can import styles across files, but you MUST add `import "@plumeria/core";` in the component file where the styles are being used.
- **Dynamic Values (Function Keys)**: If you need dynamic styles (which normally require dynamic inline styles via React's `style` prop), you should use **function keys** in `css.create()`. This allows you to apply `@media` and `@container` queries directly to dynamic styles, which is impossible with standard React `style` props.

  ```tsx
  const styles = css.create({
    palette: (color: string) => ({
      backgroundColor: color,
      // Function keys allow media/container queries on dynamic styles!
      '@media (max-width: 600px)': {
        backgroundColor: 'blue',
      }
    })
  });

  // Usage: <div styleName={styles.palette(color)} />
  ```

- **`css.use()` and Inline `style` Integration**:
  - `css.use()` simply returns a static class name string (`string`) at build time.
  - Since it compiles strictly to a static class string, **it has absolutely no integration features with the inline `style` prop**. Do not attempt to dynamically integrate or merge `css.use()` outputs with `style` props.

## Compiler Expectations

The SWC compiler relies on specific structures to perform static analysis:

- **Module Top-Level**: `css.create()` must always be placed at the top level of the module, outside of any component rendering function.
- **Static Extraction**: The compiler statically extracts `css.create()` calls.
- **Direct References**: Indirect references to variables may become unanalyzable. Define variables clearly and statically.

## ESLint Guarantees

The `@plumeria/eslint-plugin` strictly enforces Plumeria's rules. You must follow the ESLint rules by reading each implementation and the `README.md`. Because ESLint guarantees these, you can be confident when writing code that adheres to them:

- **CSS Property Value Validation**: ESLint validates the values of CSS properties.
- **Property Sort Order**: The plugin enforces a specific sort order for properties.
- **Unused Styles**: Unused styles are automatically detected.

## Examples

### Valid Examples

```tsx
import * as css from '@plumeria/core';

// 1. Module top-level definition
const styles = css.create({
  container: {
    display: 'flex',
    padding: '16px',
  },
  active: {
    backgroundColor: 'blue',
  }
});

export const MyComponent = ({ isActive }) => {
  return (
    // 2. Right side wins composition
    <div styleName={[styles.container, isActive && styles.active]}>
      Hello Plumeria
    </div>
  );
};
```

### Invalid Examples ❌

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  base: { color: 'black' }
});

export const BadComponent = ({ isActive, dynamicColor }) => {
  // ❌ INVALID: Creating styles inside the component
  const dynamicStyles = css.create({
    dynamic: { color: dynamicColor }
  });

  return (
    <div>
      {/* ❌ INVALID: Mixing className and styleName */}
      <span className="global-class" styleName={styles.base}>Text</span>
      
      {/* ❌ INVALID: Passing an object directly to styleName */}
      <span styleName={{ fontSize: '12px' }}>Small Text</span>
    </div>
  );
};
```

## Selector Rules and Nesting

Plumeria supports nesting for pseudo-classes, pseudo-elements, and attribute selectors. When defining nested styles, you must strictly follow these rules:

- **NO `&` character**: Plumeria does NOT use the `&` character for self-reference.
- **Allowed Selectors**: Nested keys must start with either `:` (for pseudo-classes and pseudo-elements) or `[` (for attribute selectors).
- **NO Complex Pseudo-classes (`:has()`, `:is()`, `:where()`)**: DO NOT use complex CSS pseudo-classes such as `:has()`, `:is()`, or `:where()`. They are strictly forbidden. Instead, use the paired `css.marker()` and `css.extended()` APIs to handle any context-aware, parent-state dependent, or descendant styling. These APIs compile safely to container style queries and can achieve all use cases typically solved by `:has()`, `:is()`, or `:where()` without compromising CSS atomicity.
- **Child Selectors are NOT Supported**: You cannot nest class names or child elements (like `.title` or `> div`) directly in the style object. Apply Plumeria styles directly to the child elements instead.
- **Media/Container Queries**:
  - You can nest a pseudo-selector (like `:hover`) inside a media or container query **exactly once**.
  - **Reverse nesting is FORBIDDEN**: You CANNOT nest a media or container query inside a pseudo-selector (doing so causes compiler/type errors).

```tsx
const styles = css.create({
  button: {
    backgroundColor: 'white',
    padding: '16px',
    
    // Pseudo-classes and elements (Starts with :)
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '::before': {
      content: '""',
      display: 'block',
    },
    
    // Attribute selectors (Starts with [)
    '[data-active="true"]': {
      border: '2px solid blue',
    },
    
    // VALID: Pseudo-selector nested inside Media Query (allowed once)
    '@media (max-width: 768px)': {
      padding: '8px',
      ':hover': {
        boxShadow: 'none',
      }
    }
  }
});

// INVALID NESTING ❌
const badStyles = css.create({
  button: {
    ':hover': {
      // ❌ FORBIDDEN: Cannot nest media query inside a pseudo-selector!
      '@media (max-width: 768px)': {
        backgroundColor: 'blue',
      }
    }
  }
});
```

## Advanced APIs

Plumeria provides several specialized APIs for advanced use cases:

### `css.marker()` and `css.extended()` (Paired Descendant Styling)
These paired APIs enable **context-aware / descendant styling** (e.g., styling a child element when the parent is hovered or focused) without relying on DOM structure combinators (which are strictly forbidden in Plumeria) or complex pseudo-classes like `:has()`, `:is()`, or `:where()`.

- **`css.marker(id, pseudo)`**: Sets a CSS variable marker on a parent element when a pseudo-class state is active. Must be spread `...css.marker(...)` in the parent style.
- **`css.extended(id, pseudo)`**: Applies styles to descendant elements when the linked marker is active. Used as a dynamic style key `[css.extended(...)]`.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  parent: {
    // 1. Set a marker with a unique identifier 'card' for ':hover' state
    ...css.marker('card', ':hover'),
    padding: '24px',
    border: '1px solid #ccc',
  },
  child: {
    transition: 'color 0.3s ease',
    // 2. React to the 'card' marker being active
    [css.extended('card', ':hover')]: {
      color: 'blue',
      // You can also nest further pseudo-classes!
      ':hover': {
        color: 'darkblue',
      }
    }
  }
});

export const Card = () => {
  return (
    <div styleName={styles.parent}>
      <span styleName={styles.child}>Hover parent to make me blue!</span>
    </div>
  );
};
```
These APIs compile to a highly optimized and atomic container style query `@container style(--card-hover: 1)` at build time, maintaining zero runtime overhead and zero dependency on DOM hierarchy.

### `css.variants()`
Allows you to map dynamic argument values to pre-defined Plumeria style objects. Note that it maps **existing** style objects (created with `css.create()`) rather than defining CSS rules inside itself.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  gradient: { background: 'linear-gradient(to right, red, blue)' },
  metallic: { background: 'linear-gradient(to bottom, #ccc, #333)' },
  small: { padding: '4px 8px' },
  medium: { padding: '8px 16px' },
  large: { padding: '12px 24px' },
});

const getButtonStyle = css.variants({
  variant: {
    gradient: styles.gradient,
    metallic: styles.metallic,
  },
  size: {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  },
});

// Usage in Component:
// <button styleName={getButtonStyle({ variant: 'gradient', size: 'medium' })}>
```

### `css.createStatic()`
Defines **static variables** (such as media query breakpoint strings) and inlines them at build time. These are typically used as dynamic keys in `css.create()`.

```tsx
import * as css from '@plumeria/core';

export const breakpoints = css.createStatic({
  xs: '@media (max-width: 480px)',
  sm: '@media (max-width: 640px)',
  md: '@media (max-width: 768px)',
  lg: '@media (max-width: 1024px)',
});

// Usage in css.create():
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
Defines scoped, dynamic CSS variables for custom themes. It takes the selector to apply as the **first argument**, and an object defining the default value and theme value (using `{ default, theme }` structure) as the **second argument**.

Since a unique hash is automatically prepended to the generated variable names, there is zero risk of name collisions with other themes or global CSS variables.

All theme values are only compiled when the theme variable is actually used in a styling block.

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

// Attribute-based theme ([data-theme="dark"]) or Media queries (@media (prefers-color-scheme: dark)) are also supported:
// export const theme = css.createTheme('[data-theme="dark"]', { ... });
// export const theme = css.createTheme('@media (prefers-color-scheme: dark)', { ... });
```


## Styling Custom Components

There are exactly **3 patterns** for applying Plumeria styles to custom components. In all patterns, compilation is always concentrated at `styleName` or `css.use()` call sites. The custom component itself simply passes the compiled `className` / `style` through to the DOM — a pure, transparent operation.

> **Core Principle**: What is impossible is dynamic compilation of custom props. Passing styles to custom components is fully supported.

### Pattern 1: Direct `styleName` inside the component

The component imports its own styles and applies them via `styleName` on internal DOM elements. The simplest pattern — styles are self-contained within the component.

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

### Pattern 2: `styleName` on the custom component at the call site

The custom component accepts `className` / `style` props (via `React.HTMLAttributes<T>`), and the **call site** applies styles using `styleName`. Since `styleName` is globally typed on `React.HTMLAttributes<T>`, it works on custom components and the compiler compiles it to `className`/`style` at the call site.

```tsx
// --- Button.tsx ---
import React from 'react';

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

// Pure passthrough — receives compiled className/style and forwards to DOM
export const Button = ({ className, style, children, ...rest }: ButtonProps) => {
  return (
    <button className={className} style={style} {...rest}>
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
});

// styleName is compiled to className="hash_primary" at this call site
<Button styleName={styles.primary}>Click me</Button>;
```

### Pattern 3: `className` bypass with `css.use()`

Use `css.use()` to convert static styles into a class name string, then pass it directly as `className`. This bypasses `styleName` entirely and relies only on the `css.use()` compilation.

```tsx
// --- Button.tsx ---
import React from 'react';

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button = ({ className, children, ...rest }: ButtonProps) => {
  return (
    <button className={className} {...rest}>
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
});

// css.use() is replaced with a static class name string at build time
<Button className={css.use(styles.primary)}>Click me</Button>;
```

### Summary

| Pattern | Compilation site | Component's role |
|---------|-----------------|-----------------|
| 1. Direct `styleName` | Inside the component | Self-contained styles |
| 2. `styleName` at call site | Call site | Passthrough `className`/`style` |
| 3. `className` bypass | Call site (`css.use`) | Passthrough `className` |

### ❌ Anti-pattern: Custom props with dynamic compilation

Custom-named props cannot be dynamically compiled because the compiler only hooks into `styleName` and `css.use()`. Custom prop names are invisible to the compiler.

```tsx
// ❌ DOES NOT WORK
const MyComponent = ({ myCustomStyle }) => {
  // The compiler cannot statically trace myCustomStyle
  return <div styleName={css.use(styles.base, myCustomStyle)} />;
};
```

## Animation APIs

### `css.keyframes()`
Generates a unique CSS `@keyframes` animation name (a hash inlined during build) to be used safely inside standard Plumeria style rules.

```tsx
import * as css from '@plumeria/core';

const fadeIn = css.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 }
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
Customizes View Transitions by generating a unique `view-transition-name` and accepting animation definitions (`group`, `imagePair`, `new`, `old`) to control transitions.

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
