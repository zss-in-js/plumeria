---
'@plumeria/compiler': minor
'@plumeria/core': minor
'@plumeria/next-plugin': minor
'@plumeria/swc-jest': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- Fix: A `next build` that reuses `.next` emits Plumeria's styles, so `.next` no longer has to be removed before each build
- Fix: `next dev` compiles its stylesheet the same way as `next build`, so styles split across modules resolve the same in both
- Fix: Editing a style in `next dev` no longer leaves rules from earlier edits or earlier dev sessions behind, and keeps the previous rules until every module has updated so the page does not flicker
- Fix: A syntax error in an imported style file no longer leaves the importing page broken in `next dev` after the file is fixed
- Fix: A dynamic key written as a string literal, such as `sizeStyles['small']`, compiles to the class name instead of a lookup table
- Fix: The unplugin compiles each module's CSS from the source it transformed, so a file whose name contains glob syntax such as `!` or `[slug]`, and a module with no file on disk, get their styles
- Feat: `compileCSS` takes `sources` to compile a given source in place of the file on disk, and `files` to compile a given list of files without a glob
- Perf: `compileCSS` reuses the CSS of unchanged files between runs
- Refactor: `transformSource` no longer collects stylesheets, and `collectOndemandSheets` and `sheets` are removed; every plugin builds its CSS through `compileCSS`
- Update: Turbopack builds require Next.js 16.0.3 or later
