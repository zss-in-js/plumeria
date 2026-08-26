# @plumeria/codemod

Codemods for moving a codebase onto Plumeria, and for migrating Plumeria APIs.
No install needed — run it with `npx`.

```sh
npx @plumeria/codemod migrate --from css-modules
npx @plumeria/codemod migrate --from plumeria
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

## `migrate --from plumeria`

The reverse of the forward migration. Every `css.create` definition under the
paths becomes a `*.module.css` beside it, and the files that use it are rewritten
— the import, the `classStyle` prop, and the style composition:

```sh
npx @plumeria/codemod migrate --from plumeria [paths...]
```

```tsx
/* Card.tsx — before */
import * as css from '@plumeria/core';

export const styles = css.create({
  base: { fontSize: 12 },
  card: {
    padding: 16,
    ':hover': { background: 'teal' },
  },
  size: (width: number) => ({ width }),
});

export function Card({ width }: { width: number }) {
  return <div classStyle={[styles.base, styles.card, styles.size(width)]} />;
}
```

```css
/* Card.module.css — generated */
.base { font-size: 12px }
.card { padding: 16px }
.card:hover { background: teal }
.size { width: var(--styles-size-width) }
```

```diff
/* Card.tsx — after */
- import * as css from '@plumeria/core';
+ import styles from './Card.module.css';
+ export { styles };

- export const styles = css.create({
-   base: { fontSize: 12 },
-   card: {
-     padding: 16,
-     ':hover': { background: 'teal' },
-   },
-   size: (width: number) => ({ width }),
- });

  export function Card({ width }: { width: number }) {
-   return <div classStyle={[styles.base, styles.card, styles.size(width)]} />;
+   return (
+     <div
+       className={[styles.base, styles.card, styles.size].join(' ')}
+       style={{ ['--styles-size-width' as string]: width }}
+     />
+   );
  }
```

A function style key such as `(width) => ({ width })` has no CSS Modules
equivalent, so each parameter becomes a CSS custom property named
`--<binding>-<key>-<param>`. The class name stays in `className`; the argument
values move to the inline `style` prop. If a `style` prop already exists, the
custom properties are merged into it.

An array with no condition in it collapses into one class that `composes` its
members, so nothing is duplicated:

```diff
- <div classStyle={[styles.base, styles.card]} />
+ <div className={styles.baseCard} />
```

Otherwise the array is joined as it stands. `filter` is added only when a
condition can make a member falsy, so that branch drops out at runtime:

```diff
- <div classStyle={[styles.base, styles.card, styles.size(width)]} />
+ <div className={[styles.base, styles.card, styles.size].join(' ')} style={{ … }} />

- <div classStyle={[styles.base, active && styles.active]} />
+ <div className={[styles.base, active && styles.active].filter(Boolean).join(' ')} />
```

`classStyle={[b, a]}` gives `a` the last word, while a stylesheet gives it to
whichever rule is written later. The export reproduces the array order by
emitting the classes in an order that satisfies every call site at once. Where
two call sites compose the same pair in opposite orders, the one that cannot be
satisfied carries an extra class holding only the disputed declarations, applied
under the same condition as the style that has to win:

```diff
- <div classStyle={[styles.raised, flat && styles.surface]} />
+ <div className={[styles.raised, flat && styles.surface, flat && styles.surfaceOverRaised].filter(Boolean).join(' ')} />
```

Order is only forced where the two classes actually disagree, measured per
at-rule and per selector. Where one property covers another — `padding` against
`padding-top` — Plumeria settles it by specificity rather than order, so the
shorthand is written first and the array has no say. Anything left unsettled is
reported as `composition-order`.

A variant picked with a bracket is resolved to the class its key names, whether
the constant is declared in the same file or imported, and a constant left
naming nothing is removed with it:

```diff
- const size = 'small';
- <div classStyle={styles[size]} />
+ <div className={styles.small} />
```

Only a `const` holding a string literal is followed. A key computed at runtime is
reported as `dynamic-style-access` and its definitions stay in Plumeria.

### Global styles

`css.createTheme`, `css.keyframes`, and `css.viewTransition` produce rules that
belong in a global stylesheet, not in a CSS Module. The codemod extracts them and
appends them to `src/styles/global.css` (or `styles/global.css` when `src` does
not exist). Theme tokens become CSS custom properties under `:where(:root)` and
the theme selector; keyframes become `@keyframes kf-<hash>`; view transitions
become `::view-transition-*` pseudo-element rules. References in style objects
are replaced by their generated names.

`css.createStatic` values are statically evaluated and inlined directly into the
generated CSS rules — no separate output file is needed.

### What it reports instead of converting

```
src/Card.tsx
  8:5  dynamic-value
        The value of `color` cannot be represented statically.
  12:3  spread-create
        Top-level spreads cannot name a CSS Module class.
```

Constructs that cannot be resolved statically — dynamic values, computed keys,
runtime function calls, and object spreads — are reported and left in place,
together with every file whose definitions they still need. A target
`*.module.css` that already exists is reported as `target-exists` and will not be
overwritten.

Several `css.create` calls in one file are not reported: they are written to the
same stylesheet, and a key an earlier call claimed is renamed.

The exit code is 1 while anything remains, so the command composes with a script.

The migration is idempotent — the first run converts, every run after it is a
fixed point:

```
f(f(x)) = f(x)
```

Clear a report and run again, and only the newly resolvable files move.

Start with `-d, --dry-run` to preview the export without writing files:

```sh
npx @plumeria/codemod migrate --from plumeria --dry-run [paths...]
```

```
  src/Card.tsx  ->  src/Card.module.css
  global styles  ->  src/styles/global.css

1 style module(s) would be exported, 1 source file(s) rewritten.
Run without --dry-run to apply.
```

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

## API Stability

**Stability: Stable** — additive only; existing signatures will not move.
See [API Stability](https://github.com/zss-in-js/plumeria#api-stability).

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
