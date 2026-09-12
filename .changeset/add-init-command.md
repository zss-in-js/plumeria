---
'@plumeria/init': patch
---

- Feat: add `@plumeria/init`, one command that sets Plumeria up in an existing project. It is run with `npx @plumeria/init`, and installed it is `plumeria-init`, alongside `plumeria-codemod` and `plumerialint`. It detects the package manager and the bundler, installs the packages that are missing, writes `plumeria.d.ts` and the bundler config, extends the ESLint flat config, and puts `plumerialint --` in front of the `build` script.
- Feat: ask which spelling of a two-named property the project writes and set both levels from the one answer — `withoutLogicalProperties` or `withoutPhysicalProperties` on the bundler plugin, and `no-logical-properties` or `no-physical-properties` in ESLint — so their directions cannot disagree.
- Feat: ask whether to turn on `expand-border-shorthands`, and which JSX prop carries styles, writing a renamed prop into the plugin and into `plumeria.d.ts` at once.
- Feat: patch an existing config rather than replace it, and extend only the `plugins` array the config object owns, so a nested one such as Vitest's `test.plugins` is never written into. Where the plugin cannot be placed safely, print the snippet and touch nothing.
- Feat: treat a config as set up only once the plugin is called, not merely imported — a bare property read, and a call inside a comment, a string or a regex literal, all read as not set up — so an import nothing calls is completed rather than skipped, and call the binding the file already named. An import spanning several lines is read as one statement, so it is never duplicated.
- Feat: on Next.js add `rimraf .next` before `dev` and before `build`, so a version change is not read as a compile error. A `pre` script is added only for a script the project has, and one it already wrote is left alone.
- Feat: look for `packageManager` and the lockfile upwards from the directory init runs in, so a package inside a workspace is installed with the manager the workspace root uses.
- Feat: mark each planned action by kind — install, write, patch, manual, skip — with `node:util`'s `styleText`, which leaves the text alone when the output is not a terminal.
- Feat: refuse a styling prop that is not an identifier, or that React already handles, from `--style-prop` as well as from the prompt.
