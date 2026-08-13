# @plumeria/eslint-plugin

ESLint plugin for Plumeria.  
Below are the available rules and the recommended configuration.

## Recommended configuration

The `plugin:@plumeria/recommended` config enables the following:

- `@plumeria/props-require-import`: **error**
- `@plumeria/no-combinator`: **error**
- `@plumeria/no-destructure`: **error**
- `@plumeria/no-inline-object`: **error**
- `@plumeria/no-inner-call`: **error**
- `@plumeria/no-invalid-selector`: **error**
- `@plumeria/no-mixed-styling-props`: **error**
- `@plumeria/no-order-dependent-overlap`: **warn**
- `@plumeria/no-unknown-css-properties`: **error**
- `@plumeria/no-unused-keys`: **warn**
- `@plumeria/sort-properties`: **warn**
- `@plumeria/format-properties`: **warn**
- `@plumeria/validate-values`: **warn**
- `@plumeria/validate-pseudos`: **error**

```js
import plumeria from '@plumeria/eslint-plugin';

export default [plumeria.configs.recommended];
```

## Configuring the styling prop

Both `props-require-import` and `no-mixed-styling-props` need to know which JSX
prop carries styles. It is `classStyle` unless you changed it, so most projects
configure nothing.

If you did rename it — via `styleProp` on `withPlumeria` or on the unplugin
options — tell the plugin the same name. ESLint cannot read it from your bundler
config, so set it once in `settings` and every rule picks it up:

```js
import plumeria from '@plumeria/eslint-plugin';

export default [
  plumeria.configs.recommended,
  {
    settings: {
      plumeria: { styleProp: 'sx' },
    },
  },
];
```

A single rule can override that if you need it to:

```js
{
  rules: {
    '@plumeria/no-mixed-styling-props': ['error', { styleProp: 'sx' }],
  },
}
```

The name must match whatever the loader or unplugin was given. If they disagree,
the lint rules report against a prop the compiler never transforms.

## Rules

### props-require-import

Disallow the styling prop in files without a `@plumeria/core` import.

Accepts `{ styleProp }`; see [Configuring the styling prop](#configuring-the-styling-prop).

### no-combinator

Disallow combinators `>`, `+`, `~` and descendant combinator (space) unless inside functional pseudo-classes.

### no-destructure

Disallow destructuring APIs.

### no-inline-object

Disallow passing inline object to `classStyle` and `css.use()`. Only compiled styles from `css.create()` are allowed.

### no-inner-call

Disallow calling APIs inside functions.

### no-invalid-selector

Disallow invalid selector inside `css.create()` and `css.keyframes()` and `css.viewTransition()`.  
`create()` example: (Pseudo -> Query, Query -> Query)

### no-mixed-styling-props

Disallow mixing the styling prop with `className` or `style`. `classStyle` can handle both `className` and `style`.

Accepts `{ styleProp }`; see [Configuring the styling prop](#configuring-the-styling-prop).

### no-order-dependent-overlap

Warns when two properties in one style overlap but neither outranks the other,
so the one written last wins. It covers one property under its logical and its
physical name, and two shorthands that cross without either containing the
other. A shorthand and its longhand are ranked by specificity and never
reported.

A pair of spellings is one property in a horizontal writing mode and two
properties in a vertical one, which is per element and cannot be read from the
source. The rule reads them as one property; disable the line where an element
is known to be vertical.

### no-physical-properties / no-logical-properties

Disallow one of the two names a property can carry, so a project writes edges
under one spelling only. `no-physical-properties` reports `paddingLeft` and
suggests `paddingInlineStart`; `no-logical-properties` reports the reverse.
Accepts `{ sizes }`, which adds `width`, `height`, their `min`/`max` forms,
`overflow-x` and `overflow-y` to the properties covered. It is `false` by
default: a size is one property under either spelling, while an edge is what a
direction reverses.

Neither is part of `recommended`, and turning both on is contradictory. Reach
for one when you want the pairs `no-order-dependent-overlap` reports to be
impossible to write: a property that appears under one spelling only can never
meet its other spelling on an element. A shorthand with no single counterpart,
such as `borderBlockWidth`, is outside either rule and stays reported.

### no-unknown-css-properties

Disallow unknown CSS properties in camelCase within `css.create`, `css.keyframes`, and `css.viewTransition`.

### no-unused-keys

Warns when object keys are defined but not used, mainly in component files.

### sort-properties

Automatically sorts CSS properties in the recommended order for consistency and maintainability.

### format-properties

Automatically format for consistency and maintainability.

- Formats a line into a multi-line.
- Formats by filling in blank lines.

### validate-values

Validates CSS property values for correctness. Only standard CSS properties are checked; properties with string literal keys (e.g., computed or dynamic property names) are not validated.

### validate-pseudos

Validates CSS pseudo-classes and pseudo-elements inside `css.create()`. It checks for typos and structural correctness and supports validation of computed keys when TypeScript is available.

## CLI (plumerialint)

This package provides a CLI command, `plumerialint`, as a convenient way
to run Plumeria's custom ESLint rules.

It uses `oxlint` internally for fast linting with code snippets in output.

### Installation

```bash
npm install -D @plumeria/eslint-plugin oxlint
# or
pnpm add -D @plumeria/eslint-plugin oxlint
```

### Usage

```bash
plumerialint
```

The process exits with a non-zero status code if any errors or warnings are found,
making it suitable for use in CI and build pipelines.

Example usage in `package.json`:

```json
{
  "scripts": {
    "lint": "plumerialint"
  }
}
```

### Aborting Builds on Lint Errors (Parallel Pipeline)

You can run `plumerialint` in parallel with your build command (e.g. `next build` or `vite build`) using the `--` separator:

```json
{
  "scripts": {
    "build": "plumerialint -- next build"
  }
}
```

If `plumerialint` detects any styling errors or warnings, it will print the diagnostics, kill the build process immediately, and exit with a non-zero code. This avoids compiling when styling validation fails.

**Note:** `oxlint` is required as `plumerialint` uses it internally.
