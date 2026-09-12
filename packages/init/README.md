# @plumeria/init

Sets Plumeria up in a project that already exists. No install needed — run it
with `npx`.

```sh
npx @plumeria/init
```

It reads the project, asks what it cannot read, shows the plan, and only then
writes. Nothing is installed or patched before you say so.

```
✔ detected  next  pnpm  typescript

  ➡︎ install  @plumeria/core @plumeria/next-plugin @plumeria/eslint-plugin oxlint
  + write    plumeria.d.ts     classStyle
  ~ patch    next.config.ts    withPlumeria(...)
  ~ patch    eslint.config.ts  plumeria.configs.recommended
  ~ patch    package.json      build: plumerialint -- next build
```

## What it detects

The package manager comes from `packageManager` or the lockfile. The bundler
comes from the dependencies, and from the config files when nothing is
installed yet: `next`, `vite`, `astro`, `webpack`, `rspack`, `rollup`,
`rolldown`, `esbuild`, `farm` and `bun`. Pass `--bundler <name>` to decide it
yourself.

Next.js gets `@plumeria/next-plugin`; every other bundler gets
`@plumeria/unplugin` with the factory that matches it.

## What it asks

**Which spelling of a two-named property does this project write?** —
`marginBlockStart` or `marginTop`. The answer reaches both sides at once: the
bundler plugin gets `withoutLogicalProperties` or `withoutPhysicalProperties`,
so the counterpart cannot compile, and ESLint gets
`@plumeria/no-logical-properties` or `@plumeria/no-physical-properties`, so it
is reported while you type. Answering "both" sets neither. `--sizes` extends
the answer to the size axis, where `width` and `inlineSize` are the pair.

**Expand a border shorthand into the three declarations it sets?** — turns on
`@plumeria/expand-border-shorthands`. A `border` shorthand crosses the axis
shorthands without either containing the other, so leaving it whole makes the
outcome depend on order.

**Which JSX prop carries styles?** — `classStyle` by default. A renamed prop is
written into the plugin as `styleProp` and declared in `plumeria.d.ts`, so the
two cannot disagree.

**Set up `@plumeria/eslint-plugin` and the `plumerialint` build guard?** — adds
the plugin and `oxlint`, writes or extends the flat config, and prefixes the
`build` script with `plumerialint --`, so a style error stops the build.

## What it writes

- `plumeria.d.ts` — the styling prop TypeScript reads.
- the bundler config — the plugin, and the options the answers chose. An
  existing config is patched: the import lands after the last import, and the
  plugin joins the `plugins` array. A Next config has its default export
  wrapped in `withPlumeria`.
- `eslint.config.ts` — `plumeria.configs.recommended` plus the rules that were
  asked for. An existing flat config is extended rather than replaced.
- `package.json` — `plumerialint --` in front of the `build` script.

A file that already names Plumeria is skipped, so a second run writes nothing.
Where the plugin cannot be placed safely — a build script rather than a config,
a config with no `plugins` array, a legacy `.eslintrc` — nothing is touched and
the snippet is printed instead.

## Options

```sh
npx @plumeria/init --dry-run            # show the plan, write nothing
npx @plumeria/init --yes                # take every default, ask nothing
npx @plumeria/init --physical --sizes   # answer the spelling question up front
npx @plumeria/init --style-prop sx
npx @plumeria/init --bundler rollup
npx @plumeria/init --no-eslint          # leave ESLint and the build script alone
npx @plumeria/init --no-install         # write the configs, print the command
npx @plumeria/init --cwd packages/app
```

Without a TTY it never asks — every unanswered question takes its default,
which is what makes it usable in CI.

Commit before running, so the writes can be reverted with `git checkout`.
