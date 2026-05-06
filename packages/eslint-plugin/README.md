# @plumeria/eslint-plugin

ESLint plugin for Plumeria.  
Below are the available rules and the recommended configuration.

## Recommended configuration

The `plugin:@plumeria/recommended` config enables the following:

- `@plumeria/style-name-requires-import`: **error**
- `@plumeria/no-combinator`: **error**
- `@plumeria/no-destructure`: **error**
- `@plumeria/no-inline-object`: **error**
- `@plumeria/no-inner-call`: **error**
- `@plumeria/no-invalid-selector-nesting`: **error**
- `@plumeria/no-unknown-css-properties`: **error**
- `@plumeria/no-unused-keys`: **warn**
- `@plumeria/sort-properties`: **warn**
- `@plumeria/format-properties`: **warn**
- `@plumeria/validate-values`: **warn**

```js
import { plumeria } from '@plumeria/eslint-plugin';

export default [plumeria.flatConfigs.recommended];
```

## Rules

### style-name-requires-import

Disallow styleName prop in files without a @plumeria/core import.

### no-combinator

Disallow combinators `>`, `+`, `~` and descendant combinator (space) unless inside functional pseudo-classes.

### no-destructure

Disallow destructuring APIs.

### no-inline-object

Disallow passing inline object to `styleName` and `css.use()`. Only compiled styles from `css.create()` are allowed.

### no-inner-call

Disallow calling APIs inside functions.

### no-invalid-selector-nesting

Disallow invalid selector nesting inside `css.create()`. (e.g. Pseudo -> Query, Query -> Query)

### no-mixed-styling-props

Disallow mixing `styleName` with `className` or `style`. `styleName` can handle both `className` and `style`.

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

**Note:** `oxlint` is required as `plumerialint` uses it internally.
