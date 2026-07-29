# @plumeria/codemod

Codemods for migrating Plumeria APIs. No install needed — run it with `npx`.

```sh
npx @plumeria/codemod rename-prop classStyle sx
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

Commit before running, so the rewrite can be reverted with `git checkout`.
