# Plumeria

Teaches Claude the rules of [Plumeria](https://plumeria.dev), a CSS-in-JS library that compiles styles to static CSS at build time. With the plugin installed, Claude writes, reviews, and fixes Plumeria styles the way the compiler expects: `css.create()` at module top level, styles bound through the `classStyle` prop, composition with arrays, and the selector rules the compiler enforces.

## What it contains

One skill, `plumeria`, which Claude loads when a task touches Plumeria styles or a project depends on `@plumeria/core`. You can also run it directly as `/plumeria:plumeria`.

The skill is generated from the official [AI.md](https://plumeria.dev/docs/ai) documentation by a script in the Plumeria repository, and CI fails whenever the two drift apart, so the plugin always carries the current rules.

The plugin has no hooks, MCP servers, or scripts. It runs nothing, sends nothing, and fetches nothing on its own. The skill only points Claude to the public Plumeria documentation at plumeria.dev when bundler or framework setup is involved.

## Install

```text
/plugin marketplace add zss-in-js/plumeria
/plugin install plumeria@plumeria
```

## License

MIT
