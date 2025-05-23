# @plumeria/eslint-plugin

ESLint plugin for Plumeria.  
Below are the available rules and the recommended configuration.

## Recommended Configuration

The `plugin:@plumeria/recommended` config enables the following:

- `@plumeria/no-inner-call`: **error**
- `@plumeria/no-unused-keys`: **warn**
- `@plumeria/sort-properties`: **warn**
- `@plumeria/validate-values`: **warn**

```js
import plumeria from '@plumeria/eslint-plugin';

export default [plumeria.flatConfigs.recommended];
```

## Rules

### no-inner-call

Disallow calling `css.create`, `css.global`, etc. inside functions.

### no-unused-keys

Warns when object keys are defined but not used, mainly in component files.

### sort-properties

Automatically sorts CSS properties in the recommended order for consistency and maintainability.

### validate-values

Validates CSS property values for correctness. Only standard CSS properties are checked; properties with string literal keys (e.g., computed or dynamic property names) are not validated.
