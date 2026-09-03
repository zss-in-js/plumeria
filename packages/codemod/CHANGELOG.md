# @plumeria/codemod

## 18.3.16

### Patch Changes

- 63c9330: - Fix: a custom property written in camelCase, such as `--fooBar`, was emitted kebab-cased as `--foo-bar` while `var(--fooBar)` in a value was left as written, so the variable never resolved. Custom property names now keep their case.
  - Fix: an at-rule nested inside another at-rule dropped the outer condition, so `@media` wrapping `@supports` compiled to the `@supports` block alone. Both conditions are now kept, and `@supports`, `@layer` and `@scope` are accepted alongside a nested query in the types.
  - Fix: a hex code inside `url()` or a quoted value was replaced with its color name, so `url(#fff)` became `url(white)` and `content: '#fff'` became `content: 'white'`. Those values are now left as written.
  - Update: `navy`, `springgreen`, `powderblue` and `lavenderblush` are normalized like the other named colors.

## 18.3.15

### Patch Changes

- cea31e3: Bump version to 18.3.15

## 18.3.14

### Patch Changes

- 0be895c: Bump version to 18.3.14

## 18.3.13

### Patch Changes

- 1b27b59: Bump version to 18.3.13

## 18.3.12

### Patch Changes

- cf0091d: Bump version to 18.3.12

## 18.3.11

### Patch Changes

- dc8fb4d: Bump version to 18.3.11

## 18.3.10

### Patch Changes

- c53466e: Bump version to 18.3.10

## 18.3.9

### Patch Changes

- 69cd071: Bump version to 18.3.9

## 18.3.8

### Patch Changes

- 9fc80c2: Update README.md

## 18.3.7

### Patch Changes

- b867ab2: Bump version to 18.3.7

## 18.3.6

### Patch Changes

- 5c48f91: Bump version to 18.3.6

## 18.3.5

### Patch Changes

- eb4fb7e: Bump version to 18.3.5

## 18.3.4

### Patch Changes

- 91c1796: Bump version to 18.3.4

## 18.3.3

### Patch Changes

- 79812c2: Bump version to 18.3.3

## 18.3.2

### Patch Changes

- a524e7a: - Fix: `migrate --from plumeria` writes a `css.keyframes` into the CSS Module that reads it rather than into the global stylesheet. A CSS Module renames the value of `animation-name` the way it renames a class, so a global `@keyframes` never matched the renamed reference. One a `css.viewTransition` names is written globally as well, since a `::view-transition-*` rule is not scoped.
  - Fix: the global stylesheet is looked for at `app/global.css` and `src/app/global.css`, under either the `global.css` or `globals.css` spelling, before a new `styles/global.css` is created. An App Router project imports the former from its root layout, and nothing imported the file the migration used to write.
  - Fix: only the definitions an exported style reaches are written out. A `css.keyframes`, `css.viewTransition`, or `css.createTheme` that nothing reads, or that only a file the migration held back reads, stays in the TypeScript file that declares it.
  - Feat: `migrate --from css-modules` reads a stylesheet's `@keyframes` back into a `css.keyframes` binding, and splits an `animation` shorthand naming one into its longhands. A keyframe step no longer reports as an unsupported selector.

## 18.3.1

### Patch Changes

- 64c033e: Bump version to 18.3.1

## 18.3.0

### Minor Changes

- 8449a58: Bump version to 18.3.0

## 18.2.34

### Patch Changes

- f3794bd: Bump version to 18.2.34

## 18.2.33

### Patch Changes

- 903ea85: Bump version to 18.2.33

## 18.2.32

### Patch Changes

- 72b0f67: Bump version to 18.2.32

## 18.2.31

### Patch Changes

- bffb1cd: Bump version to 18.2.31

## 18.2.30

### Patch Changes

- bc2ddf3: Bump version to 18.2.30

## 18.2.29

### Patch Changes

- b21a78a: Bump version to 18.2.29

## 18.2.28

### Patch Changes

- 8a62e49: - Update: the package now says on npm what it does. `migrate --from css-modules` is the reason most people reach for it, and neither the description nor the keywords named CSS Modules at all.

## 18.2.27

### Patch Changes

- e184f05: - Update: `migrate --from css-modules` converts several selector shapes it used to report. A compound class rides on the class written last, a chain of three or more classes becomes one marker per level with each gated by the one above it, a bare tag under a class takes a key of its own that the consumer rewrite attaches to the markup it can see — a child combinator taking a different key from a descendant one, and reaching one level rather than any — and an attribute selector or a `:global` ancestor becomes an `:is()` selector key.
  - Update: the styling prop is written in stylesheet order rather than in the order the class list carried, a `composes` expansion included, because a class list has no order of its own in CSS. Reads of two stylesheets keep the slots they were given, since which of them the bundler puts first is not a fact one file holds.
  - Fix: the migration no longer writes a call site it cannot answer for. A class a rule was refused for, and a pair whose order Plumeria's rank settles against the one CSS gives it — a declaration under an at-rule, or further down the shorthand graph, outranks one written after it — are reported and the stylesheet is held whole: nothing written and no consumer moved, so a later run converts it once the rule named in the report is dealt with.

## 18.2.26

### Patch Changes

- 9f53ed0: Bump version to 18.2.26

## 18.2.25

### Patch Changes

- 0b45a2d: Update dependencies

## 18.2.24

### Patch Changes

- e8067fc: - Fix: `migrate --from css-modules` overwrote a `*.styles.ts` that was already there without reporting it. A stylesheet whose target exists is now reported as `target-exists` and left alone, the way the export already treats an existing `*.module.css`, and its consumers keep the import they had rather than being pointed at a file that was never written.
  - Fix: `migrate --from css-modules` left a style read with a run-time key spelling the stylesheet import it had just renamed, so `s[name]` survived as an unbound identifier. The read now carries the generated binding.
  - Fix: `migrate --from plumeria` folded a style key named by a constant only inside a composition array, so `classStyle={styles[VARIANT]}` kept the constant while the import that carried it was retired. A lone call site folds the same way.

## 18.2.23

### Patch Changes

- 14ac9f0: - Fix: `migrate --from css-modules` drops the pixel guard the export put around a function style argument, so `styles.box(width)` comes back as it was written rather than carrying a `typeof` test the custom property no longer needs. Left in, it was wrapped in another guard the next time the project was exported and the file stopped compiling, so a project with a function style in it could be adopted back but never exported again.
  - The round trip closes: a project exports, adopts back, and exports again, with each direction reaching a fixed point on its second pass.

## 18.2.22

### Patch Changes

- 1da7747: - Fix: `migrate --from plumeria` reproduces the rank a declaration is given in Plumeria — one step per shorthand covering the property, one more under an at-rule — which settles the pair rather than the order it was written in. It orders the rules and the declarations inside them, so a base longhand still outranks a shorthand set under a media query.
  - Fix: `migrate --from plumeria` recognises two properties that only partly overlap — `borderColor` against `borderTop` — as sharing ground, so the order the call site composes them in is carried into the stylesheet instead of being read as unrelated. A pair that both covers and partly overlaps keeps both answers, through a class that carries only the crossing declarations.
  - Fix: `migrate --from plumeria` writes a narrower condition after the one it implies, so a `@media (min-width: 900px)` rule still wins where a `@media (min-width: 600px)` rule also matches.
  - Fix: `migrate --from plumeria` folds a composition whose members come from separate modules into a single class in the first of them. Two stylesheets have no order that reaches both, and a fold puts the members back under one that does.
  - Fix: `migrate --from plumeria` carries the unit Plumeria would have added into an argument reaching a function style through a custom property, so `styles.box(100)` is still `100px` after the export.
  - Fix: `migrate --from css-modules` finds a module the same way wherever it looks, so a style read as a value and a function style call are both restored in a file whose stylesheet sits beside it.

## 18.2.21

### Patch Changes

- ad35eaa: - Feat: `migrate --from plumeria` resolves a style read with a key named by a constant — `styles[size]` where `size` is a `const` holding a string, in the same file or imported from another — to the class it names instead of reporting it, and removes a constant left naming nothing with it.
  - Fix: `migrate --from css-modules` writes a restored read with the name the import carries, so a composed array, a `css.use` call, and a local holding a style survive a file whose module was renamed on the way back.

## 18.2.20

### Patch Changes

- a1c9e4b: - Fix: `migrate --from plumeria` reproduces the order a `classStyle` array composes in, by ordering the generated rules to satisfy every call site, collapsing an unconditional array into one class that `composes` its members, and giving a call site that still disagrees an override class carrying only the disputed declarations.
  - Fix: `migrate --from plumeria` leaves a file the plan cannot export in Plumeria together with every file it reads definitions from, so a partial migration no longer leaves source that does not compile.
  - Fix: `migrate --from plumeria` converts negative values, `css.use`, a token read outside a style, a style arriving through a prop, and a `classStyle` on an element that already carries `className`, instead of reporting them or rewriting them by halves.
  - Fix: `migrate --from plumeria` writes the generated import with the other imports rather than where the `css.create` stood, and replaces the block appended to `global.css` on a re-run instead of appending it again.
  - Fix: `migrate --from css-modules` points a consumer at where the module actually landed, restores a composed array, a `css.use` call, and a function style call, and keeps one name per module when a file reads several.
  - Fix: `migrate --from plumeria` reports a style read with a computed key rather than exporting it, because the class it names is not known until it runs.

## 18.2.19

### Patch Changes

- 69b7897: - Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.
  - Fix: import specifiers are resolved through `tsconfig.json` `paths`, directory `index` files, and filenames that carry a dot, so a definition reached under an alias is found instead of reported as dynamic.
  - Feat: `css.createStatic` values imported from another file are inlined into the generated CSS, and the import is removed only when nothing outside the exported styles still reads it.
  - Feat: `css.marker` and `css.extended` are expanded into the custom property and the `@container style()` rule they compile to.
  - Feat: several `css.create` calls in one file are written to one stylesheet, renaming a key an earlier call already claimed and repointing its usages.
  - Feat: a file that only defines styles is left untouched and its consumers are pointed at the generated `*.module.css`, matching how `--from css-modules` leaves the original stylesheet in place.

## 18.2.18

### Patch Changes

- e2018e9: - Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.

## 18.2.17

### Patch Changes

- e8950f2: - Update: README.md and documentation describe using `--dry-run` to preview a CSS Modules migration without writing files.

## 18.2.16

### Patch Changes

- 172eeaa: Bump version to 18.2.16

## 18.2.15

### Patch Changes

- 050be48: Bump version to 18.2.15

## 18.2.14

### Patch Changes

- 6ee1a20: Bump version to 18.2.14

## 18.2.13

### Patch Changes

- d2f5a82: Bump version to 18.2.13
- 13d5fd7: Bump version to 18.2.13

## 18.2.12

### Patch Changes

- 7c32413: Bump version to 18.2.12

## 18.2.11

### Patch Changes

- 79cf605: Bump version to 18.2.11

## 18.2.10

### Patch Changes

- 05ec58a: Bump version to 18.2.10

## 18.2.9

### Patch Changes

- cacc782: Bump version to 18.2.9

## 18.2.8

### Patch Changes

- 3f0f14b: Bump version to 18.2.8

## 18.2.7

### Patch Changes

- ddc0c29: Bump version to 18.2.7

## 18.2.6

### Patch Changes

- 055e0a1: Bump version to 18.2.6

## 18.2.5

### Patch Changes

- fa97e3e: Bump version to 18.2.5

## 18.2.4

### Patch Changes

- a259fce: Bump version to 18.2.4

## 18.2.3

### Patch Changes

- 7641416: Bump version to 18.2.3

## 18.2.2

### Patch Changes

- a2db725: Update: README.md

## 18.2.1

### Patch Changes

- 9e8f603: Feat: migrate a CSS Modules stylesheet with `migrate --from css-modules`

## 18.2.0

### Minor Changes

- 9becf0a: Bump version to 18.2.0

## 18.1.9

### Patch Changes

- 73fc784: Bump version to 18.1.9

## 18.1.8

### Patch Changes

- fa39906: Update dependencies (postcss 8.5.25, GHSA-r28c-9q8g-f849)

## 18.1.7

### Patch Changes

- f233fe1: Bump version to 18.1.7

## 18.1.6

### Patch Changes

- 5d03b90: Bump version to 18.1.6

## 18.1.5

### Patch Changes

- 9f7072b: Bump version to 18.1.5

## 18.1.4

### Patch Changes

- 4464af6: Bump version to 18.1.4

## 18.1.3

### Patch Changes

- 0325770: Update dependencies

## 18.1.2

### Patch Changes

- b8ee5f7: Bump version to 18.1.2

## 18.1.1

### Patch Changes

- 4c16d5b: Bump version to 18.1.1

## 18.1.0

### Minor Changes

- 29a90d8: Bump version to 18.1.0

## 18.0.1

### Patch Changes

- 5c34fd1: Bump version to 18.0.1
