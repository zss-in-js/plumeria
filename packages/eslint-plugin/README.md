# @plumeria/eslint-plugin

ESLint plugin for Plumeria.  
Below are the available rules and the recommended configuration.

## Recommended configuration

The `plugin:@plumeria/recommended` config enables the following:

- `@plumeria/no-destructure`: **error**
- `@plumeria/no-inner-call`: **error**
- `@plumeria/no-unused-keys`: **warn**
- `@plumeria/sort-properties`: **warn**
- `@plumeria/validate-values`: **warn**

```js
import { plumeria } from '@plumeria/eslint-plugin';

export default [plumeria.flatConfigs.recommended];
```

## Rules

### no-destructure

Disallow destructuring `css.create` and `css.props`, etc.

### no-inner-call

Disallow calling `css.create`, etc. inside functions.

### no-unused-keys

Warns when object keys are defined but not used, mainly in component files.

### sort-properties

Automatically sorts CSS properties in the recommended order for consistency and maintainability.

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
