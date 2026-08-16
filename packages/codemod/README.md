# @plumeria/codemod

Codemods for moving a codebase onto Plumeria, and for migrating Plumeria APIs.
No install needed — run it with `npx`.

```sh
npx @plumeria/codemod migrate --from css-modules
npx @plumeria/codemod rename-prop classStyle sx
```

Commit before running, so the rewrite can be reverted with `git checkout`.

## `migrate --from css-modules`

Converts every `*.module.css` under the paths into a `*.styles.ts` beside it,
and rewrites the files importing it — the import, the `className` prop, the
class names, and `composes`:

```sh
npx @plumeria/codemod migrate --from css-modules [paths...]
```

```css
/* Card.module.css */
.base { font-size: 12px }
.card { composes: base; padding: 16px }
.card:hover { background: teal }
.card .card-title { color: red }
```

```ts
/* Card.styles.ts */
import * as css from '@plumeria/core';

export const styles = css.create({
  base: { fontSize: 12 },
  card: {
    ...css.marker('card', ':defined'),
    padding: 16,
    ':hover': { background: 'teal' },
  },
  cardTitle: {
    [css.extended('card', ':defined')]: { color: 'red' },
  },
});
```

```diff
/* Card.tsx */
+ import '@plumeria/core';
- import styles from './Card.module.css';
+ import { styles } from './Card.styles';

- <div className={styles.card}>
-   <span className={styles['card-title']} />
+ <div classStyle={[styles.base, styles.card]}>
+   <span classStyle={styles.cardTitle} />
  </div>
```

A descendant rule has no combinator to translate into, so it becomes
`css.marker` on the parent and `css.extended` on the child. Which class is which
is read from the stylesheet; no markup is inspected. Class names become
camel-case keys, and a bare pixel length loses its unit.

### What it reports instead of converting

```
src/Card.module.css
  10:1  sibling-combinator  .item + .item
        A marker carries no order. Write the relation as a selector key.
```

Sibling combinators, `:global`, and a `composes` reaching into another file are
named rather than guessed at, and the original rule is left in place. The exit
code is 1 while anything remains, so the command composes with a script.

Start with `-d, --dry-run` to inspect the migration without creating any
`*.styles.ts` files or rewriting their consumers:

```sh
npx @plumeria/codemod migrate --from css-modules --dry-run [paths...]
```

```
  src/Card.module.css  ->  src/Card.styles.ts

1 stylesheet(s) would be converted, 1 consumer(s) rewritten.
Run without --dry-run to apply.
```

Any rules that cannot be converted are reported in the same run, and the exit
code remains 1 while such rules are present. Remove `--dry-run` to write the
generated modules and consumer changes.

## `rename-prop`

Renames the styling prop across your source. The names are arguments, so it
works for any rename, not just default prop:

```sh
npx @plumeria/codemod rename-prop <from> <to> [paths...]
```

| Option        | Effect                                          |
| ------------- | ----------------------------------------------- |
| `-d, --dry-run` | report what would change without writing        |
| `--no-types`  | leave TypeScript declarations untouched         |

Paths default to the current directory. `node_modules`, `dist`, `build`, `out`,
`.next` and `coverage` are skipped.

### What it rewrites

JSX attributes:

```diff
- <div classStyle={styles.card} />
+ <div sx={styles.card} />
```

And property signatures annotated with Plumeria's `Style`, which covers the
global augmentation in your `plumeria.d.ts` as well as your own component props:

```diff
  interface CardProps {
-   classStyle?: Style;
+   sx?: Style;
  }
```

The annotation has to be `Style` for the rename to happen, so an unrelated
interface that happens to use the same key is left alone.

### What it reports instead of rewriting

Where the prop is destructured or read off an object, renaming it would change a
local binding and not just the prop, so those are listed for you to handle:

```
2 occurrence(s) need a manual rename — "classStyle" is bound to a local name there:
  src/components/Card.tsx:8:12
  src/components/Card.tsx:14:22
```

## After the rename

The rewrite only touches your source. Point the rest of the toolchain at the new
name too:

```js
// next.config.ts / unplugin options
withPlumeria(nextConfig, { styleProp: 'sx' });
```

```js
// eslint.config.js
settings: { plumeria: { styleProp: 'sx' } }
```
