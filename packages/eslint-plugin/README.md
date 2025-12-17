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

This package also provides a small CLI, `plumerialint`, as a convenient way
to run only Plumeria’s ESLint rules.

It uses the same recommended configuration internally, so no additional
setup is required.

```bash
plumerialint
```

By default, it lints the following file types:

- `.ts`, `.tsx`
- `.js`, `.jsx`

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
