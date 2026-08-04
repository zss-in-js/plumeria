# Plumeria

[![Tests](https://img.shields.io/github/actions/workflow/status/zss-in-js/plumeria/tests.yml?logo=github&logoColor=white&label=tests&color=10B981)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)
![Codecov](https://img.shields.io/codecov/c/github/zss-in-js/plumeria?logo=codecov&logoColor=white&color=6366F1)

**Plumeria** is a **zero-cost abstraction layer** for styling React components. You write type-safe styles in TypeScript, and the compiler resolves them into atomic CSS at build time — leaving no runtime JavaScript behind. Its axioms are grounded in category theory, making styles self-evident, predictable, and composable by construction, while strict syntax and linting keep the cognitive overhead low.

## Example

Styles can be passed to the `classStyle` prop. That prop accepts static and dynamic styles as an array. At build time, the compiler resolves `classStyle` into a static `className`; dynamic values are passed as CSS variables through the `style` attribute — no runtime library is involved.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12
  },
  cond: {
    background: 'navy'
  },
  scale: (value) => ({
    scale: value
  })
});

export default function App({ cond }) {
  const scale = useScale(); // from your own hook
  return (
    <div
      classStyle={[
        styles.text,
        cond && styles.cond,
        styles.scale(scale)
      ]}
    />
  );
}
```

**Compiled:**

```tsx
<div
  className={'xhrr6ses xhxthtyw' + ' ' + (cond ? 'xj00ajs1' : '')}
  style={{ '--xfuma1qq-value': scale }}
/>
```

**Generated CSS:**

```css
.xhrr6ses:not(#\#) {
  font-size: 12px;
}
.xhxthtyw {
  scale: var(--xfuma1qq-value);
}
.xj00ajs1 {
  background: navy;
}
```

## API Stability

Plumeria publishes frequently. To make that legible, every public API is rated for **future** change likelihood — not past churn. The rating is a commitment about what will happen next, not a description of what already has.

| Rating | Label            | Meaning                                                                                 |
| ------ | ---------------- | --------------------------------------------------------------------------------------- |
| ★★★★★  | **Frozen**       | No breaking changes planned. Any change ships in a major release with a migration path. |
| ★★★★☆  | **Stable**       | Additive only. Existing signatures will not move.                                       |
| ★★★☆☆  | **Candidate**    | Shape is settled. Details may still change.                                             |

### Core API — `@plumeria/core`

| API                  | Stability |        |
| -------------------- | --------- | ------ |
| `css.create`         | ★★★★★     | Frozen |
| `css.createTheme`    | ★★★★★     | Frozen |
| `css.createStatic`   | ★★★★★     | Frozen |
| `css.keyframes`      | ★★★★★     | Frozen |
| `css.viewTransition` | ★★★★★     | Frozen |
| `css.marker`         | ★★★★☆     | Stable |
| `css.extended`       | ★★★★☆     | Stable |
| `css.use`/`classStyle`| ★★★★★    | Frozen | 

> The **`classStyle`** property can be changed.

### Bundler Integrations

| Package                      | Stability |           |
| -----------------------------| --------- | --------- |
| `@plumeria/next-plugin`      | ★★★★☆     | Stable    |
| `@plumeria/unplugin`         | ★★★★☆     | Stable    |
| `@plumeria/turbopack-loader` | ★★★★☆     | Stable    |

### Tooling

| Package                   | Stability |           |
| --------------------------| --------- | --------- |
| `@plumeria/codemod`       | ★★★☆☆     | Candidate |
| `@plumeria/eslint-plugin` | ★★★★☆     | Stable    |
| `@plumeria/inspector`     | ★★★☆☆     | Candidate |

### Internal

| Package              | Stability |        |
| -------------------- | --------- | ------ |
| `@plumeria/compiler` | ★★★★☆     | Stable |
| `@plumeria/utils`    | ★★★★☆     | Stable |

> **Not planned** — a predefined utility atom vocabulary, a runtime style merger, or fallback chains. None can be reconciled with the closed-world static resolution performed by scanAll(). For one-off styles, give them a local name in css.create — the naming requirement is deliberate. For how this compares with open-world systems such as StyleX, see the [side-by-side benchmark](https://github.com/refirst11/stylex-plumeria-benchmark).

## Structure

Versioning: All versions are standardized for consistency.

- `.github`
  - Contains workflows used by GitHub Actions.
  - Contains other templates.
- `examples`
  - Example applications using Plumeria.
- `packages`
  - Contains the individual packages managed in the monorepo.
  - [codemod](https://github.com/zss-in-js/plumeria/tree/main/packages/codemod)
  - [compiler](https://github.com/zss-in-js/plumeria/tree/main/packages/compiler)
  - [core](https://github.com/zss-in-js/plumeria/tree/main/packages/core)
  - [eslint-plugin](https://github.com/zss-in-js/plumeria/tree/main/packages/eslint-plugin)
  - [headlessui](https://github.com/zss-in-js/plumeria/tree/main/packages/headlessui)
  - [inspector](https://github.com/zss-in-js/plumeria/tree/main/packages/inspector)
  - [next-plugin](https://github.com/zss-in-js/plumeria/tree/main/packages/next-plugin)
  - [turbopack-loader](https://github.com/zss-in-js/plumeria/tree/main/packages/turbopack-loader)
  - [unplugin](https://github.com/zss-in-js/plumeria/tree/main/packages/unplugin)
  - [utils](https://github.com/zss-in-js/plumeria/tree/main/packages/utils)
- `test-e2e`
  - Contains e2e tests built with Playwright and Next.js for final quality assurance.

## Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

[Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## Acknowledgements

- [Linaria](https://linaria.dev/) - for inspiring the Zero-Runtime architecture
- [React Native](https://reactnative.dev/docs/stylesheet) - for inspiring the StyleSheet.create
- [React Native for Web](https://necolas.github.io/react-native-web/) - for inspiring that attempt
- [React Strict DOM](https://facebook.github.io/react-strict-dom/) - for inspiring the Strict architecture philosophy
- [StyleX](https://stylexjs.com/) - for inspiring the optimized Atomic CSS
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the brilliance of its approach

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
