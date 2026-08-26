# @plumeria/turbopack-loader

The loader that compiles Plumeria styles in a Next.js build, under Turbopack and webpack alike.

It reads each module, resolves `css.create` statically, rewrites the styling prop into a `className` string, and removes the `@plumeria/core` import along with the style declarations. The rules it extracts are collected into a stylesheet, and an import of that stylesheet is appended to the module, so the CSS reaches the app through the same graph the components do.

```tsx
// in
const styles = css.create({ box: { padding: 16, color: 'red' } });
export const A = () => <div classStyle={styles.box} />;

// out
export const A = () => <div className={"xqqbxt1d xq96bg3w"} />;
import "../../node_modules/@plumeria/turbopack-loader/zero-virtual.css";
```

Nothing of the library survives into the output, so a React Server Component keeps its styles with no `'use client'` boundary to add.

## Setup

You do not configure this loader yourself. [`@plumeria/next-plugin`](https://www.npmjs.com/package/@plumeria/next-plugin) installs it and wires it into both bundlers:

```bash
npm i -D @plumeria/next-plugin
```

```ts
// next.config.ts
import { withPlumeria } from '@plumeria/next-plugin';

export default withPlumeria({});
```

## Options

`withPlumeria` passes its second argument through as the loader's options:

```ts
export default withPlumeria({}, {
  include: ['./app/**/*.{ts,tsx}'],
  exclude: ['**/node_modules/**'],
  styleProp: 'sx',
});
```

- `include` — the files to compile. The default is `['**/*.{js,jsx,ts,tsx}']`.
- `exclude` — the files to leave alone. The default is `['**/node_modules/**', '**/dist/**', '**/.next/**']`.
- `styleProp` — the JSX prop that carries styles. The default is `'classStyle'`.

The prop name here and the one declared in `plumeria.d.ts` have to match. If they disagree, the prop type-checks but is never compiled away.

## The stylesheet

Rules are written to `zero-virtual.css` inside this package, and each compiled module imports it by relative path. In development the file grows as modules are compiled; a production build fills it in one pass before any module is processed, which is what [`@plumeria/compiler`](https://www.npmjs.com/package/@plumeria/compiler) is installed for. Writes are taken under a lock, so concurrent builds do not lose rules.

If styles are missing from a page, the module was not compiled — check that its path is matched by `include` and not by `exclude`.

## Testing

A loader is a function that reads four properties off `this`, so it can be called on its own, with no bundler and no DOM in between. A Next.js project tests the loader its own build runs:

```js
// compile.test.js
const loader = require('@plumeria/turbopack-loader');
const fn = loader.default ?? loader; // built as CommonJS with an ESM default

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

test('a media query does not collide with the base rule', async () => {
  const code = await compile(`
    import * as css from '@plumeria/core';
    const styles = css.create({
      box: { color: 'red', '@media (min-width: 640px)': { color: 'blue' } },
    });
    export const A = () => <div classStyle={styles.box} />;
  `);

  const classes = code.match(/className=\{"([^"]*)"\}/)[1].split(' ');
  expect(new Set(classes).size).toBe(classes.length);
});
```

It is plain asynchronous JavaScript, so Jest, Vitest and `node:test` all run it as it stands. Add this package to your `devDependencies` before requiring it: it arrives as a dependency of the plugin either way, but a strict package manager such as pnpm does not put a transitive dependency where your own code can reach it.

The rewritten code comes back through `async`. The stylesheet is written only under `NODE_ENV=development`, so a test run reads the class names and leaves the file alone; set the variable when the stylesheet is what you came for.

Read the class names out of the returned code rather than hard-coding them. An atomic class name is one property–value pair, hashed, so a list spelled out in a test breaks the next time a property is added to the style.

See [Testing](https://plumeria.dev/docs/testing) for the layer this belongs to, and the two it does not cover.

## API Stability

**Stability: Frozen** — the signature will not change; behaviour may still be corrected.
See [API Stability](https://github.com/zss-in-js/plumeria#api-stability).

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
