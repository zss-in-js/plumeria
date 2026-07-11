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

### Dynamic Style Resolution (Bracket Notation)
The `css.variants()` API has been removed in favor of standard bracket notation (`styles[variant]`). Plumeria compiles these expressions into static lookup tables at build time, preserving its zero-runtime philosophy.

```tsx
import * as css from '@plumeria/core';

// 1. Define dynamic styles in a dedicated, minimal css.create()
const sizeStyles = css.create({
  small: { fontSize: '12px' },
  medium: { fontSize: '16px' },
  large: { fontSize: '20px' },
});

// 2. Define type schema (using string literal unions or keyof typeof)
type Size = 'small' | 'medium' | 'large';
// Or dynamically: type Size = keyof typeof sizeStyles;

interface ButtonProps {
  size: Size;
  children: React.ReactNode;
}

export const Button = ({ size, children }: ButtonProps) => {
  return (
    // 3. Resolve style dynamically using bracket notation
    <button styleName={sizeStyles[size]}>
      {children}
    </button>
  );
};
```

#### Best Practices for Bracket Notation:
* ⚠️ **Minimize keys inside the style object**: Every key defined inside a `css.create()` that is used with bracket notation will be compiled into the generated inline lookup table (e.g., `{"small":"...","medium":"..."}[size]`). To avoid generating bloated tables, always separate your variants into dedicated, minimal `css.create()` calls rather than mixing them with unrelated static styles.
* **Local variable assignments are supported**: Storing a bracket expression in a local constant before passing it to `styleName` (e.g., `const currentStyle = sizeStyles[size]; <div styleName={currentStyle} />`) is fully supported. The compiler dynamically traces local style variables and inlines them back during JSX extraction.

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

> **Core Principle**: Custom props and `styleName` typed as `StyleName` are statically analyzed by the compiler, allowing you to pass styles seamlessly across custom components.

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

### Pattern 2: Direct `StyleName` prop passing (via custom prop like `styleArry`)

Since `styleName` is compiled directly to `className`/`style` at the call site, using `styleName` as a prop name on a custom component will cause it to be replaced before the component runs. To pass styles down, use a custom prop name (such as `styleArry`) typed as `StyleName`. Plumeria's compiler statically traces and resolves these properties across component boundaries at build time, allowing you to pass them directly to the `styleName` of any internal elements.

By composing styles in an array like `styleName={[styles.text, styleArry]}`, the styles passed from the call site can override the component's internal base styles (following the **"Right Side Always Wins"** rule). In the example below, the call site's `fontSize: '24px'` overrides the internal `fontSize: '12px'`.

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArry?: css.StyleName;
}

// base style
const styles = css.create({
  text: {
    fontSize: '12px',
  },
});


// Pass styleArry directly to the inner DOM element's styleName
export const Button = ({ children, styleArry }: ButtonProps) => {
  return <button styleName={[styles.text, styleArry]}>{children}</button>;
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
    fontSize: '24px'
  }
});

// The compiler traces styleArry and resolves it correctly
<Button styleArry={[styles.primary, styles.text]}>Click me</Button>;
```

### Pattern 3: `className` bypass with `css.use()` (via custom prop like `styleArry`)

You can also use `css.use()` inside custom components to compile static styles and dynamic props into a class name string. By passing the custom prop (typed as `StyleName`) directly to `css.use()`, Plumeria's compiler will statically trace and resolve the styling at build time.

```tsx
// --- Button.tsx ---
import React from 'react';
import * as css from '@plumeria/core';

type ButtonProps = {
  children: React.ReactNode;
  styleArry?: css.StyleName;
}

// base style
const styles = css.create({
  text: {
    fontSize: '12px',
  },
});

// Pass styleArry inside css.use() to generate className
export const Button = ({ children, styleArry }: ButtonProps) => {
  return (
    <button className={css.use(styles.text, styleArry)}>
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
    fontSize: '24px'
  }
});

// The compiler traces styleArry inside css.use() and resolves it correctly
<Button styleArry={[styles.primary, styles.text]}>Click me</Button>;
```

### Summary

| Pattern | Compilation site | Component's role |
|---------|-----------------|-----------------|
| 1. Direct `styleName` | Inside the component | Self-contained styles |
| 2. Direct `StyleName` prop | Traced and compiled | Receives and applies `StyleName` |
| 3. `className` bypass | Inside the component (`css.use`) | Resolves `StyleName` into `className` |

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
