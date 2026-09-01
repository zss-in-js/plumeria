# Release Notes

## 18.3.12 (Sep 1, 2026)

Fix: a style handed to a component through a prop threw `Dynamic or unresolvable style object` when that component was written as a function declaration or exported as the default. Every form a component can take is now read, and `compileCSS` falls back to the file's other components when the owner holds no entry, as the bundler plugins already did.

Fix: a constant read through more than one property, such as `theme.colors.primary`, resolved to nothing, so the declaration was dropped from the sheet without an error and an interpolation of it was left empty. The whole path is now walked.

## 18.3.11 (Aug 31, 2026)

Fix: `compileCSS` read each globbed file at the path the glob returned, which is relative to `cwd`. Passing a `cwd` other than the process directory threw `ENOENT`. The path is now resolved against `cwd` before it is read.

Perf: a value that holds none of `kf-`, `vt-` or `cr-` skips the reference marker scan, which the on-demand walk had been running over every string it visits. Every match begins with one of the three, so the set of references found is unchanged.

## 18.3.10 (Aug 30, 2026)

Perf: a value that holds no `var(` skips the custom property scan, which the on-demand walk had been running over every string it visits. The gate is implied by the pattern it guards, so the set of variables found is unchanged.

## 18.3.9 (Aug 30, 2026)

Update README.md

## 18.3.8 (Aug 29, 2026)

Update README.md

## 18.3.7 (Aug 29, 2026)

Fix: a theme variable written with a fallback, or nested inside another variable's fallback, was not recognised as used, so its declaration never reached the sheet and the value fell back for want of anything to read. The name is now read up to where the fallback begins, rather than up to a closing parenthesis that may belong to an inner `var()`.

## 18.3.6 (Aug 29, 2026)

- Fix: a `css.keyframes` or `css.viewTransition` binding read inside a template literal or a concatenation lost the `kf-` / `vt-` prefix its own name carries, so the value named a rule that was never emitted and an `animation` shorthand built that way animated nothing. The binding now reads the same wherever it is read.

- Fix: a reference sitting in the middle of a value, as an `animation` shorthand holds one, is now found when collecting the rules a sheet needs, instead of only when it is the whole value.

## 18.3.5 (Aug 29, 2026)

- Fix: a `css.createTheme` selector written as anything other than a string literal — a template literal, or a name the file declares — was read as an empty selector, which dropped the theme's whole rule and left the styles pointing at custom properties nothing declared. The selector is now resolved the same way a style value is, so a name or a `createStatic` entry works, and two themes that differ only by selector stay apart.

- Fix: a selector that still cannot be read at build time is now reported where it is written, instead of compiling to no CSS at all.

## 18.3.4 (Aug 29, 2026)

- Fix: editing only the selector passed to `css.createTheme` left the rule under the old selector setting the same custom properties, because their names were hashed from the value alone and never from the selector. The selector is now part of the hash, so the rule left behind declares variables of its own and stops competing with the new one.

- Fix: `@plumeria/utils` hashes a `createTheme` declaration the same way in the scan pass as in the transform, which had left the selector out of the scan pass alone.

## 18.3.3 (Aug 28, 2026)

- Fix: `sort-properties` places `animationFillMode`, `animationComposition`, `animationTimeline`, `animationRange`, `animationRangeStart`, `animationRangeEnd`, `borderBlockColor`, `borderBlockStyle`, `borderBlockWidth`, `borderInlineColor`, `borderInlineStyle`, `borderInlineWidth`, and `whiteSpaceCollapse` in the group they belong to. The order table did not carry them, so `--fix` sorted each one past every property it knows.

- Fix: `validate-values` accepts `anchor()` only in the inset properties and `anchor-size()` only in the accepted `@position-try` properties. Both were accepted wherever a length is, and both are invalid outside those properties.

- Fix: `validate-values` compares keywords, global values, and units without regard to case, so `display: 'BLOCK'` and `width: '10PX'` no longer report. CSS keywords are ASCII case-insensitive.

- Feat: `validate-values` checks the value of `animationRange`, `animationRangeStart`, and `animationRangeEnd` against the named timeline ranges, and reports a numeric `animationTimeline`. None of the four were checked at all.

## 18.3.2 (Aug 27, 2026)

- Fix: `migrate --from plumeria` writes a `css.keyframes` into the CSS Module that reads it rather than into the global stylesheet. A CSS Module renames the value of `animation-name` the way it renames a class, so a global `@keyframes` never matched the renamed reference. One a `css.viewTransition` names is written globally as well, since a `::view-transition-*` rule is not scoped.

- Fix: the global stylesheet is looked for at `app/global.css` and `src/app/global.css`, under either the `global.css` or `globals.css` spelling, before a new `styles/global.css` is created. An App Router project imports the former from its root layout, and nothing imported the file the migration used to write.

- Fix: only the definitions an exported style reaches are written out. A `css.keyframes`, `css.viewTransition`, or `css.createTheme` that nothing reads, or that only a file the migration held back reads, stays in the TypeScript file that declares it.

- Feat: `migrate --from css-modules` reads a stylesheet's `@keyframes` back into a `css.keyframes` binding, and splits an `animation` shorthand naming one into its longhands. A keyframe step no longer reports as an unsupported selector.

## 18.3.1 (Aug 27, 2026)

- Update: README.md

## 18.3.0 (Aug 26, 2026)

- Feat: add the `@plumeria/unplugin/factory` subpath, which hands back the transform as a plain function, so a test compiles a source string and reads the class names and the stylesheet out of it with no bundler in between. The bundler entries reach `unplugin` itself, which is ESM and cannot be required from a CommonJS runner; the factory carries only a type import of it, and loads under Jest as it stands.

- Update: `@plumeria/turbopack-loader` declares `exports` rather than leaning on `main`. The entry and `zero-virtual.css` are named — the two `@plumeria/next-plugin` resolves, and the two a test driving the loader directly reaches — where nothing else under `dist/` was ever referenced.

## 18.2.34 (Aug 25, 2026)

- Fix: a style function with a destructured parameter called with no argument — `styles.box()` against `({ tone = 'navy' }) => ...` — aborted the build with an internal `TypeError` instead of compiling. The same call already worked under `@plumeria/turbopack-loader`, and a parameter left without a default is now reported the way a named call with a missing key already was.

## 18.2.33 (Aug 25, 2026)

- Feat: `@plumeria/headlessui` adds `Label`, `Separator`, `Avatar`, `Progress` and `VisuallyHidden`, bringing the exported set to twenty-five component groups.

## 18.2.32 (Aug 25, 2026)

- Fix: resolve `@plumeria/headlessui` under Node's ESM loader by emitting relative exports with file extensions, and drop the redundant `classStyle` declarations on the six `Arrow` components. `@plumeria/inspector` no longer depends on `@plumeria/headlessui`, which it never imported.

## 18.2.31 (Aug 24, 2026)

- Fix: allow any number as a `linear()` easing stop in `validate-values`, so generated spring and bounce curves that overshoot past 1 or dip below 0 are no longer reported. Leading-dot numbers such as `.5` are now reported in `linear()` and `cubic-bezier()`, as they already were everywhere else.

## 18.2.30 (Aug 24, 2026)

- Fix: accept CSS variables in individual `cubic-bezier()` and `linear()` arguments, and stop `text-decoration-line` from accepting arbitrary tokens in `validate-values`.

## 18.2.29 (Aug 23, 2026)

- Fix: support nested CSS variables while rejecting malformed variables and invalid function values in `validate-values`.

## 18.2.28 (Aug 22, 2026)

- Update: the package now says on npm what it does. `migrate --from css-modules` is the reason most people reach for it, and neither the description nor the keywords named CSS Modules at all.

## 18.2.27 (Aug 22, 2026)

- Update: `migrate --from css-modules` converts several selector shapes it used to report. A compound class rides on the class written last, a chain of three or more classes becomes one marker per level with each gated by the one above it, a bare tag under a class takes a key of its own that the consumer rewrite attaches to the markup it can see — a child combinator taking a different key from a descendant one, and reaching one level rather than any — and an attribute selector or a `:global` ancestor becomes an `:is()` selector key.

- Update: the styling prop is written in stylesheet order rather than in the order the class list carried, a `composes` expansion included, because a class list has no order of its own in CSS. Reads of two stylesheets keep the slots they were given, since which of them the bundler puts first is not a fact one file holds.

- Fix: the migration no longer writes a call site it cannot answer for. A class a rule was refused for, and a pair whose order Plumeria's rank settles against the one CSS gives it — a declaration under an at-rule, or further down the shorthand graph, outranks one written after it — are reported and the stylesheet is held whole: nothing written and no consumer moved, so a later run converts it once the rule named in the report is dealt with.

## 18.2.26 (Aug 21, 2026)

- Fix: two components declared in one file that receive a style through the same prop name shared one lookup table, so the second rendered with the first one's keys and reached the element with no class at all. Each component now reads the table it owns, in the bundler plugins and in the generated stylesheet alike.

- Fix: a style function's parameter default was read as neither a default nor a name, so `(c = 'red') => ({ color: c })` produced an empty class even when an argument was passed. A default now compiles to the CSS variable's fallback, so `box()` and `box('blue')` share one class and only the second writes an inline style.

- Fix: a style function that takes no parameter resolved to nothing when it was called, so `() => ({ color: 'red' })` left the styling prop off the element entirely. It now compiles to the class its static equivalent would.

- Fix: a style key that is only digits was dropped without a word. `css.create({ 1: { color: 'red' } })` is now reported, the way `@plumeria/no-invalid-selector` already reported it; a quoted `'1'` and a name carrying digits are unaffected.

- Fix: a style key holding a quote or a backslash was written into the run-time lookup table unescaped, which made the compiled module invalid JavaScript.

- Fix: `css.use()` with no arguments, and `css.use()` on a style that cannot be resolved, survived into the output after the `@plumeria/core` import had already been removed, leaving a module that throws on load. The first compiles to an empty class and the second is reported.

- Fix: `css.keyframes()` with no argument aborted the transform with an internal error instead of being skipped, the way `create()` and `viewTransition()` already are.

- Update: the style prop table is read by the owning component's key rather than scanned, so a project with many components generates its stylesheet faster — 44ms against 83ms on a 400-component benchmark.

## 18.2.25 (Aug 19, 2026)

Update dependencies

## 18.2.24 (Aug 18, 2026)

- Fix: `migrate --from css-modules` overwrote a `*.styles.ts` that was already there without reporting it. A stylesheet whose target exists is now reported as `target-exists` and left alone, the way the export already treats an existing `*.module.css`, and its consumers keep the import they had rather than being pointed at a file that was never written.

- Fix: `migrate --from css-modules` left a style read with a run-time key spelling the stylesheet import it had just renamed, so `s[name]` survived as an unbound identifier. The read now carries the generated binding.

- Fix: `migrate --from plumeria` folded a style key named by a constant only inside a composition array, so `classStyle={styles[VARIANT]}` kept the constant while the import that carried it was retired. A lone call site folds the same way.

## 18.2.23 (Aug 18, 2026)

- Fix: `migrate --from css-modules` drops the pixel guard the export put around a function style argument, so `styles.box(width)` comes back as it was written rather than carrying a `typeof` test the custom property no longer needs. Left in, it was wrapped in another guard the next time the project was exported and the file stopped compiling, so a project with a function style in it could be adopted back but never exported again.

- The round trip closes: a project exports, adopts back, and exports again, with each direction reaching a fixed point on its second pass.

## 18.2.22 (Aug 18, 2026)

- Fix: `migrate --from plumeria` reproduces the rank a declaration is given in Plumeria — one step per shorthand covering the property, one more under an at-rule — which settles the pair rather than the order it was written in. It orders the rules and the declarations inside them, so a base longhand still outranks a shorthand set under a media query.

- Fix: `migrate --from plumeria` recognises two properties that only partly overlap — `borderColor` against `borderTop` — as sharing ground, so the order the call site composes them in is carried into the stylesheet instead of being read as unrelated. A pair that both covers and partly overlaps keeps both answers, through a class that carries only the crossing declarations.

- Fix: `migrate --from plumeria` writes a narrower condition after the one it implies, so a `@media (min-width: 900px)` rule still wins where a `@media (min-width: 600px)` rule also matches.

- Fix: `migrate --from plumeria` folds a composition whose members come from separate modules into a single class in the first of them. Two stylesheets have no order that reaches both, and a fold puts the members back under one that does.

- Fix: `migrate --from plumeria` carries the unit Plumeria would have added into an argument reaching a function style through a custom property, so `styles.box(100)` is still `100px` after the export.

- Fix: `migrate --from css-modules` finds a module the same way wherever it looks, so a style read as a value and a function style call are both restored in a file whose stylesheet sits beside it.

## 18.2.21 (Aug 18, 2026)

- Feat: `migrate --from plumeria` resolves a style read with a key named by a constant — `styles[size]` where `size` is a `const` holding a string, in the same file or imported from another — to the class it names instead of reporting it, and removes a constant left naming nothing with it.

- Fix: `migrate --from css-modules` writes a restored read with the name the import carries, so a composed array, a `css.use` call, and a local holding a style survive a file whose module was renamed on the way back.

## 18.2.20 (Aug 18, 2026)

- Fix: `migrate --from plumeria` reproduces the order a `classStyle` array composes in, by ordering the generated rules to satisfy every call site, collapsing an unconditional array into one class that `composes` its members, and giving a call site that still disagrees an override class carrying only the disputed declarations.

- Fix: `migrate --from plumeria` leaves a file the plan cannot export in Plumeria together with every file it reads definitions from, so a partial migration no longer leaves source that does not compile.

- Fix: `migrate --from plumeria` converts negative values, `css.use`, a token read outside a style, a style arriving through a prop, and a `classStyle` on an element that already carries `className`, instead of reporting them or rewriting them by halves.

- Fix: `migrate --from plumeria` writes the generated import with the other imports rather than where the `css.create` stood, and replaces the block appended to `global.css` on a re-run instead of appending it again.

- Fix: `migrate --from css-modules` points a consumer at where the module actually landed, restores a composed array, a `css.use` call, and a function style call, and keeps one name per module when a file reads several.

- Fix: `migrate --from plumeria` reports a style read with a computed key rather than exporting it, because the class it names is not known until it runs.

## 18.2.19 (Aug 17, 2026)

- Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.

- Fix: import specifiers are resolved through `tsconfig.json` `paths`, directory `index` files, and filenames that carry a dot, so a definition reached under an alias is found instead of reported as dynamic.

- Feat: `css.createStatic` values imported from another file are inlined into the generated CSS, and the import is removed only when nothing outside the exported styles still reads it.

- Feat: `css.marker` and `css.extended` are expanded into the custom property and the `@container style()` rule they compile to.

- Feat: several `css.create` calls in one file are written to one stylesheet, renaming a key an earlier call already claimed and repointing its usages.

- Feat: a file that only defines styles is left untouched and its consumers are pointed at the generated `*.module.css`, matching how `--from css-modules` leaves the original stylesheet in place.

## 18.2.18 (Aug 16, 2026)

- Update: groundwork for `npx @plumeria/codemod migrate --from plumeria`.
Note: the command is usable from 18.2.19.

## 18.2.17 (Aug 16, 2026)

- Update: README.md and documentation describe using `--dry-run` to preview a CSS Modules migration without writing files.

## 18.2.16 (Aug 16, 2026)

- Update: README.md separates the rules enabled by the recommended config from optional property-policy and border-expansion rules.

## 18.2.15 (Aug 16, 2026)

- Feat: two states that can hold at once, such as `:hover` and `:focus`, now settle their intersection by composition order. The atom from the style written further right in `classStyle` receives one more `:not(#\#)` and becomes a class of its own, so reversing the array reverses the winner and the module the bundler reached first no longer decides. Only a pair that is otherwise indistinguishable is weighted; a differing at-rule, shorthand depth or selector specificity is left alone, and an explicit compound such as `:hover:focus` stays above the weighting.

- Feat: `no-order-dependent-overlap` also reports two states written in one style that can match at the same time and set the same property, including two states on one pseudo-element such as `:hover::before` and `:focus::before`. Mutually exclusive states, differing pseudo-elements and pairs already ranked by specificity are left alone. Report only, no suggestion.

## 18.2.14 (Aug 15, 2026)

- Fix: ESLint rules now check properties inside function style keys, including unused keys, validation, sorting, formatting, and shorthand expansion.

## 18.2.13 (Aug 15, 2026)

- Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.

- Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.

## 18.2.12 (Aug 14, 2026)

- Fix: `expand-border-shorthands` expands a `var()` or a template-literal expression that stands as one token, assigning it to the component the other tokens leave open; such a value was reported as unsplittable.

- Fix: the expansion writes `currentColor` for an omitted color instead of `currentcolor`, which `validate-values` rejected, and `validate-values` now lists `currentColor` as a `borderColor` keyword.

## 18.2.11 (Aug 13, 2026)

- Fix: `no-order-dependent-overlap` also reports two conditions in one style where one provably matches a subset of the other and the narrower one is written first. Only a single numeric `min-` or `max-` range on one axis is compared; the swap is offered as a suggestion.

- Fix: `@plumeria/utils` places a conditional at-rule after every condition that contains it while optimizing, so the narrower condition wins everywhere both apply.

- Fix: `zss-engine@2.5.0` reads a condition as the interval it matches, so implication is recognized across `min-`/`max-` prefixes, comparison and two-sided forms, and `and` chains, on `width`, `height`, `inline-size` and `block-size`, for `@container` alongside `@media`.

Note: two conditions that overlap without either containing the other, such as `600px`–`900px` against `700px`–`1000px`, are still decided by source order.

## 18.2.10 (Aug 13, 2026)

- Feat: `@plumeria/eslint-plugin` adds `expand-border-shorthands`, a fixable rule that expands the eleven border bundles (`border`, `borderTop`, `borderBlock`, …) into their width, style and color declarations, writing each component's initial value where one was omitted. A value that cannot be split, such as `var(--edge)` or `inherit`, is reported without a fix. Not part of `recommended`.

## 18.2.9 (Aug 13, 2026)

- Fix: `@plumeria/compiler` sorts the file list it globs, so the stylesheet is emitted in the same order on every machine. The scan pass is sorted as well.

- Feat: `@plumeria/eslint-plugin` adds `no-physical-properties` and `no-logical-properties`, which keep a project on one spelling of the properties that carry both a logical and a physical name. `{ sizes }`, `false` by default, extends them to `width`, `height`, their `min`/`max` forms, `overflow-x` and `overflow-y`. Neither is part of `recommended`.

## 18.2.8 (Aug 13, 2026)

- Feat: `@plumeria/eslint-plugin` adds `no-order-dependent-overlap`, which reports two properties written in one style that overlap while neither one outranks the other: one property under its logical and its physical name, or two shorthands that cross, such as `borderTop` beside `borderBlockWidth`. Suggestions only, no autofix. `warn` in `recommended`.

- Fix: `zss-engine@2.4.3` registers `corner-shape` and the eight corner longhands it sets, which carried no depth at all, and exports the shorthand graph the rule ranks pairs from.

Note: the corner longhands now receive one `:not(#\#)` where they received none. Class names are unaffected.

## 18.2.7 (Aug 12, 2026)

- Fix: `@plumeria/core` exposes `overflowInline` instead of `overflowBlockX` — the logical counterpart of `overflow-x` is `overflow-inline`, and CSS has no `overflow-block-x`.

- Fix: `zss-engine@2.4.2` aligns the shorthand graph with the logical property groups: the physical edges now sit below the axis shorthand that sets them across `margin`, `padding`, `inset`, `scroll-margin`, `scroll-padding` and the `border` axes, `overflow` and `overscroll-behavior` gain their missing logical longhands, and `containIntrinsicSize`, `positionTry`, `marker`, `cue`, `pause` and `rest` are registered as shorthands.

Note: these depths decide how many `:not(#\#)` selectors an atomic class receives, so the generated stylesheet changes for the properties listed above. Class names are unaffected.

## 18.2.6 (Aug 12, 2026)

- Fix: `@plumeria/utils` gives a nested selector inside a conditional rule both the nested and the condition depth, so `@media { ':hover': ... }` outranks a bare `':hover'` regardless of stylesheet order. Custom properties stay exempt and receive no depth.

- Fix: `@plumeria/utils` moves conditional at-rules (`@media`, `@container`, `@supports`, `@layer`, `@scope`) after base rules while optimizing, so a conditional declaration wins over a base declaration of equal specificity. `@keyframes` is left where it is.

## 18.2.5 (Aug 12, 2026)

- Fix: `@plumeria/utils` preserves shorthand and longhand declarations as independent atoms, and merges identical selectors and at-rules without reordering them during optimization.

- Fix: `@plumeria/turbopack-loader` optimizes its accumulated development virtual stylesheet, so duplicate selectors and at-rules are merged consistently.

- Fix: `zss-engine@2.4.1` removes the override-longhand behavior: a longhand written above a shorthand is no longer crushed by it, and declarations merge the same way regardless of order. No effect under the ESLint `recommended` rules.

- Fix: logical longhand properties receive specificity from their depth in the shorthand graph — `padding-block-start` gets two `:not(#\#)` selectors in base styles and three inside conditional rules.

- Update: base and conditional priority is controlled by specificity instead of moving media queries to the end of the stylesheet, so development and production behave the same.

## 18.2.4 (Aug 11, 2026)

- Fix: drop the asterisk wildcard from style prop attribution. A prop now counts as applied only inside the component that received it, so a component that merely forwards a same-named prop fails the never-applied check instead of slipping past it.

## 18.2.3 (Aug 11, 2026)

- Fix: a style prop that is never applied fails the build instead of silently dropping the style. `classStyle={[styles.base, cond && styleArray]}` and `classStyle={cond ? styleArray : styles.base}` now compile: the styles a prop's call sites pass are carried through the condition, and a closed gate leaves the surrounding styles in place.

## 18.2.2 (Aug 9, 2026)

- Update: dependencies
- Update: README.md

## 18.2.1 (Aug 7, 2026)

- Feat: migrate a CSS Modules stylesheet with `migrate --from css-modules`

## 18.2.0 (Aug 7, 2026)

- Feat: accept functional pseudo-classes in `css.marker` / `css.extended`
- The generated marker variable now carries a hash, so its name changes

## 18.1.9 (Aug 7, 2026)

- Keep a literal argument to a dynamic function key off the px fallback on a unitless property

## 18.1.8 (Aug 5, 2026)

- Update dependencies (postcss 8.5.25, GHSA-r28c-9q8g-f849)

## 18.1.7 (Aug 5, 2026)

- Update: README.md

## 18.1.6 (Aug 4, 2026)

- Update README.md
- Update: nextjs
- Fix: name the css variable of a dynamic function key after the declaration it resolves to, so two keys that share a parameter name no longer overwrite each other on one element
- Fix: set the variable for a parameter that only appears under a nested selector or an at-rule
- Fix: resolve a dynamic function key written inside a condition, instead of dropping the branch it belongs to
- Fix: read the named parameters of a destructured signature, and fold such an argument into the rule only when its value is written out in full
- Fix: report a dynamic function key that cannot reach the element, instead of emitting a call that throws at runtime


## 18.1.5 (Aug 3, 2026)

- Update README.md

## 18.1.4 (Aug 2, 2026)

- Fix: keep the virtual css id relative so a bundler cannot print the author's directories into the stylesheet it ships
- Fix: strip the annotation naming the virtual css from the emitted stylesheet on esbuild and Bun

## 18.1.3 (Aug 2, 2026)

- Update dependencies

## 18.1.2 (Aug 2, 2026)

- Fix: tell two bracket groups apart when one condition folds both into a lookup, a key both objects carry no longer answers with the later group's style
- Fix: number a bracket dimension's keys in a compound lookup, a key holding the `__` the compound key is joined with no longer blurs where one dimension ends

## 18.1.1 (Jul 31, 2026)

- Fix: merge the sources of a styling prop in the order they are written, an unconditional style placed after a condition no longer loses to it
- Fix: a condition placed after a bracket group is no longer overridden by that group

## 18.1.0 (Jul 30, 2026)

- Feat: accept a non-literal bracket key inside a condition, `enabled ? styles[variant] : styles.disabled` no longer fails to compile
- Feat: fold an argument's mutually exclusive branches into one lookup, so nesting no longer doubles the generated table per level
- Fix: emit CSS for a bracket group reached through a condition, `enabled && styles[variant]` produced no rules at all

## 18.0.1 (Jul 30, 2026)

- Fix: register prop styles for member expression JSX tags, `<svg.Logo classStyle={...} />` failed to compile
- Fix: resolve a component tag through the export graph so any chain depth lands on the module its leaf is declared in
- Fix: track namespace imports so `<Icons.Logo />` resolves through `import * as Icons`
- Perf: resolve the component key once per JSX element instead of once per attribute

## 18.0.0 (Jul 29, 2026)

- feat: add @plumeria/codemod for renaming the styling prop across a codebase
- fix: read styleProp in no-inline-object, it matched styleName only
- fix: name the configured prop in the css.use() dynamic style error
- break: rename the default styling prop from styleName to classStyle
- break: rename the @plumeria/core/style-name subpath to @plumeria/core/class-style
- break: rename the styleName prop on @plumeria/headlessui components to classStyle
- break: rename the no-inline-object messageId to noInlineObjectInStyleProp

## 17.0.1 (Jul 28, 2026)

- Fix: add contain autocomplete keywords size inline-size layout style paint in csstypes.d.ts
- Fix: fix contain include multiple keywords and single keyword in validate-values.ts

## 17.0.0 (Jul 28, 2026)

- feat: generate the production stylesheet from the loader, PostCSS is no longer required
- feat: add styleProp, include and exclude options to the loader
- feat: add styleProp option to unplugin and to the lint rules
- feat: rename lint rule style-name-requires-import to props-require-import
- fix: stop collecting prop styles from host elements
- perf: apply Turbopack rule conditions on Next.js 16 and above
- perf: skip discarded conversions in the first scanning pass
- break: @plumeria/core no longer declares a styling prop, reference @plumeria/core/style-name
- break: rename the StyleName type to Style
- break: remove @plumeria/postcss-plugin

## 16.5.0 (Jul 26, 2026)

- fix: identifier replacement now skips non-reference positions
- feat: bracket conditional expressions with dynamic and literal keys
- fix: splitCssRules standalone comment handling
- refactor: remove dead code across compiler, turbopack-loader, and unplugin

## 16.4.2 (Jul 24, 2026)

- Fix: fix error occurring with dynamic props

## 16.4.1 (Jul 24, 2026)

- Fix: add orderMdeiaLast for development mode
- Fix: parser.ts remove dead code and utils/optimizer.ts add orderMediaLast and isMediaRule

## 16.4.0 (Jul 21, 2026)

- Fix: inspector to subpath architecture and remove production argument

## 16.3.0 (Jul 21, 2026)

- Fix: add StyleName to SVG Attributes in css.d.ts

## 16.2.12 (Jul 20, 2026)

- Feat: export getRootIdentifier
- Fix: throw an unknown function

## 16.2.11 (Jul 20, 2026)

- Fix: extend overrideLonghand scope to pseudo-selectors
- Fix: enable validate-pseudos rule for the plumerialint command

## 16.2.10 (Jul 18, 2026)

- Refactor: improve acquireLock (turbopack-loader)
- Fix: incremental generation HMR and initial startup in dev mode

## 16.2.9 (Jul 17, 2026)

- Update npm core README.md

## 16.2.8 (Jul 17, 2026)

- Update @rust-gear/glob to v1.1.0

## 16.2.7 (Jul 16, 2026)

- Perf: update dependencies code

## 16.2.6 (Jul 16, 2026)

- Fix: change index to key hash(classString) in parser.ts
- Fix: change x.index and entry.index to x.key and entry.key in compiler
- Fix: change the reverse edge to a safe implementation and switched the key from index to key also output the CSS prop on the parent side
- Fix: fix use function and export CSSProperties

## 16.2.5 (Jul 15, 2026)

- Fix: style-name-requires-imports rule add fix

## 16.2.4 (Jul 14, 2026)

- Fix bracket expansion

## 16.2.3 (Jul 14, 2026)

- Fix: add resolveExport
- Fix: add getFileDependencies and resolveExport
- Bump version 16.2.3
- Fix dependencies graph and re export
- Fix: remove warning in plumerialint

## 16.2.2 (Jul 13, 2026)

- Fix other css supported

## 16.2.1 (Jul 12, 2026)

- Feat parallel run oxlint for CLI

## 16.2.0 (Jul 12, 2026)

- Bump version 16.2.0 (add validate-pseudos eslint rule)
- Add validate-pseudos eslint rule

## 16.1.1 (Jul 12, 2026)
- inspector enable OIDC

## 16.1.0 (Jul 12, 2026)
- Add inspector package (Development Visualization Support Tool)

## 16.0.0 (Jul 12, 2026)

- Add support for dynamic props and update variants API to use optimized bracket syntax
- Feat dynamic props parsing and add helper types for component props
- Remove variants API and update StyleName types and export AtomicClassNameFor
- Add support for dynamic props compilation

## 15.1.3 (Jul 10, 2026)

- Support computed key in no-unknown-css-properties.ts

## 15.1.2 (Jul 10, 2026)

- Update dependencies
- turbopack-loader: Fix edge case in style recovery resolution
- turbopack-loader: Fix merging the className with a ternary expression

## 15.1.1 (Jul 10, 2026)

- unplugin: Fix edge case merging the className with a ternary expression


## 15.1.0 (Jul 6, 2026)

- Added operators for modulo, exponentiation, and bitwise operations, and modified the code to skip operators such as typeof

## 15.0.0 (Jul 5, 2026)

- Add 14 headless components and updates to switch them from a flat structure to a chained component format

## 14.2.1 (Jun 30, 2026)

- headlessui: refactor export in index.ts and sideEffects false in package.json

## 14.2.0 (Jun 28, 2026)

- Add headlessui package

## 14.1.2 (Jun 27, 2026)

- Fix type assertion
- Fix variants.ts dead code

## 14.1.1 (Jun 27, 2026)

- Added logic to check for and delete the lock file, restricted to the development environment
- Fix parallel write conflicts by serializing the operations

## 14.1.0 (Jun 26, 2026)

- turbopack-loader: outputs minimal atoms
- next-plugin: resets CSS during development startup
- Fix default and theme properties of createTheme to be string type
- Support basic arithmetic operations

## 14.0.0 (Jun 20, 2026)

- Enhance error handling for edge cases
- core: update README.md


## 13.2.3 (Jun 20, 2026)

- unplugin: Align the hash logic of createTheme with turbopack-loader

## 13.2.2 (Jun 19, 2026)

- compiler: Align the hash logic of createTheme with turbopack-loader
- Update dependencies in v13.2.2
- Remove regular expression logic

## 13.2.1 (Jun 15, 2026)

- Update keywords in package.json

## 13.2.0 (Jun 15, 2026)

- Fix type definitions and update
- Fix dynamic className and style attributes and cleanStaleThemeRules regex edge cases

## 13.1.5 (Jun 6, 2026)

- Fix types and add inline-object for variants to the rules in no-inline-object.ts

## 13.1.4 (Jun 6, 2026)

- Add funding and homepage in package.json

## 13.1.3 (Jun 6, 2026)

- Update dependencies
- Fix export in types.d.ts
- Move rollup plugin utils to dependencies

## 13.1.1 (Jun 3, 2026)

- Add ident type to the return function of variants

## 13.1.0 (Jun 2, 2026)

- Implementation type definition for IDE hover
- Fix HMR bug

## 13.0.2 (Jun 2, 2026)

- Fix add ReadonlyTheme in types.d.ts

## 13.0.1 (Jun 2, 2026)

- Fix add a colon to the regular expression
- Fix atomize createTheme

## 13.0.0 (Jun 2, 2026)

- Support new createTheme
- The createTheme API has been revamped
- Disabled in dev mode
- Support new createTheme and robust error handling

## 12.0.8 (May 30, 2026)

- Fix lightningcss target browser and fix resolver.ts

## 12.0.7 (May 30, 2026)

- Update dependencies
- Update package.json

## 12.0.6 (May 26, 2026)

- Update keywords in package.json
- Fix a bug in the ternary operator for function keys
- Optimize scanAll in parser.ts

## 12.0.5 (May 23, 2026)

- Fix path resolution and refactoring

## 12.0.3 (May 21, 2026)

- Improve csstypes.d.ts
- Improve validData.ts

## 12.0.2 (May 19, 2026)

- Register createStatic for value
- Fix correct identifier resolution
- Remove dev cache time

## 12.0.0 (May 18, 2026)

- Support for ESLint 8 has ended
- Update dependencies

## 11.2.1 (May 15, 2026)

- Reconfigured as no-invalid-selector

## 11.2.0 (May 15, 2026)

- Remove css.js
- Implementation to remove import statements

## 11.1.3 (May 10, 2026)

- Prevent theme conflicts and stabilize HMR

## 11.1.2 (May 9, 2026)

- Support shorthand syntax for key functions

## 11.1.0 (May 6, 2026)

- Add no-invalid-selector-nesting and no-mixed-styling-props
- Refactor and pass tests

## 11.0.2 (May 4, 2026)

- Feat implementation dynamic key multi arguments
- Feat function keys can now take multiple arguments

## 11.0.1 (May 4, 2026)

- Update package.json field
- Update import path ocne pack

## 11.0.0 (May 3, 2026)

- Add unplugin

## 10.5.3 (Apr 30, 2026)

- Fix windows path

## 10.5.2 (Apr 29, 2026)

- Implementation cache in sort-properties.ts

## 10.5.1 (Apr 28, 2026)

- Perf unknown-css-properties and validate-values

## 10.5.0 (Apr 27, 2026)

- Add no-inline-object-rule and format-properties sort-properties validate-values ​​to limit the scope to plumeria
- Fix corrected the writing logic to enable HMR for exported createTheme
- Refactor and update test covered

## 10.4.3 (Apr 26, 2026)

- Improve type-safety in csstypes.d.ts
- Improve to exclude objects from the value in validate-values.ts

## 10.4.2 (Apr 25, 2026)

- Perf StableString in csstypes.d.ts

## 10.4.1 (Apr 24, 2026)

- Update package.json and README.md

## 10.4.0 (Apr 23, 2026)

- Improve autocomplete in csstypes.d.ts
- Add 15 css properties in validate-values.ts

## 10.3.1 (Apr 20, 2026)

- Add keywords stylex

## 10.3.0 (Apr 18, 2026)

- Improve CSS type system with strictString and global values

## 10.2.3 (Apr 15, 2026)

- Update dependencies

## 10.2.2 (Apr 13, 2026)

- Update dependencies
- Refactor in types.d.ts and csstypes.d.ts

## 10.2.1 (Apr 11, 2026)

- Improve CSS property type definitions
- Add keyframes and viewTransition in no-unknown-css-properties rule

## 10.2.0 (Apr 10, 2026)

- Add rule no-unknown-css-properties

## 10.1.3 (Apr 8, 2026)

- Export type StyleName in css.d.ts

## 10.1.2 (Apr 7, 2026)

- Improve background type in csstype.d.ts
- Fix borderImage in validate-values.ts

## 10.1.1 (Apr 6, 2026)

- Add copyright attribution for Meta's StyleX to csstype.d.ts

## 10.1.0 (Apr 5, 2026)

- Fixed the speed of type definition completion

## 10.0.8 (Apr 5, 2026)

- Implementation on-demand structure

## 10.0.7 (Apr 4, 2026)

- Refactor types definition

## 10.0.6 (Apr 3, 2026)

- Update dependencies
- Refactoring and remove CreateStyle
- Remove unnecessary init process

## 10.0.4 (Apr 1, 2026)

- Update dependencies

## 10.0.2 (Mar 31, 2026)

- Css.use() only compiles static styles
- Static use() error handling
- Remove syntax error throw

## 10.0.1 (Mar 29, 2026)

- Patch bump
- Remove import css properties type
- Fix To use styleName you need to import core
- Parser.ts error handling

## 10.0.0 (Mar 27, 2026)

- StyleName prop has been implemented
- Added new type StyleName
- Add rule style-name-requires-import
- Bump major v10

## 9.1.2 (Mar 23, 2026)

- Update dependencies (zss-engine, @rust-gear/glob)

## 9.1.1 (Mar 22, 2026)

- Update nextjs dev dependencies

## 9.1.0 (Mar 21, 2026)

- The naming has been corrected to avoid conflicts with TS built-in types, specifically CreateReturnType
- Infinite loading, HMR unresponsive
- AppendFileSync has been migrated to writeFileSync while maintaining HMR smoothly

## 9.0.4 (Mar 18, 2026)

- Plugin quality improvement issue (#371)

## 9.0.3 (Mar 16, 2026)

- Filenames under lib changed to style

## 9.0.2 (Mar 15, 2026)

- No delete comments case format-properties.ts

## 9.0.0 (Mar 10, 2026)

- css.props to css.use (breaking change)

## 8.0.3 (Mar 9, 2026)

- @rust-gear/glob for file scanning and optimize scanAll caching and invocation frequency
- Migrate file scanning from fs.globSync to @rust-gear/glob and implement short-duration caching for scanAll

## 8.0.2 (Mar 7, 2026)

- Fix first line comment out error

## 8.0.1 (Mar 4, 2026)

- Reset timing is now consolidated to when the server is shut down normally
- Fixed css reset overworking in edge cases eg: when opened in a separate tab

## 8.0.0 (Mar 4, 2026)

- Vendor prefix values ​​have been removed from types
- FontSizeAdjust support from-font value

## 7.6.1 (Feb 28, 2026)

- Plumerialint add format-properties rule

## 7.6.0 (Feb 28, 2026)

- Add format-properties rule

## 7.5.5 (Feb 27, 2026)

- Hmr stabilization

## 7.5.4 (Feb 25, 2026)

- Sort-properties changed from warning about the impact range to warning about only that property

## 7.5.3 (Feb 25, 2026)

- New system color keyword has been excluded

## 7.5.2 (Feb 22, 2026)

- Improved memory and disk performance

## 7.5.1 (Feb 19, 2026)

- Removed core files end line

## 7.5.0 (Feb 18, 2026)

- Fix accumulation in development mode
- Optimizer minify for production only

## 7.4.2 (Feb 11, 2026)

- Description readme headling update

## 7.4.1 (Feb 11, 2026)

- Package description and css.d.ts update

## 7.4.0 (Feb 10, 2026)

- Exporting internal types is no longer supported

## 7.3.8 (Feb 6, 2026)

- Add sideEffect false

## 7.3.7 (Feb 6, 2026)

- Bump verion to 7.3.7
- Empty entry file add empty export

## 7.3.6 (Feb 6, 2026)

- Fix entry points and keyword

## 7.3.4 (Feb 4, 2026)

- Package.json files types/

## 7.3.3 (Feb 2, 2026)

- Add main module types file. support react-router and vite-vue and vite-svelte etc.

## 7.3.2 (Feb 2, 2026)

- Removed ContainerStyleQuery type

## 7.3.1 (Feb 1, 2026)

- Improved marker and extended types
- Marker selector merge use deepMerge

## 7.3.0 (Jan 31, 2026)

- There was a change in types: function was refactored to const and type.
- CreateTheme style gen has been ondemand

## 7.2.4 (Jan 29, 2026)

- Bump verion to 7.2.4

## 7.2.3 (Jan 29, 2026)

- Exposed api types and fixed type bugs

## 7.2.2 (Jan 29, 2026)

- Rollback 7.2.0

## 7.2.1 (Jan 29, 2026)

- Function changed to constant

## 7.2.0 (Jan 28, 2026)

- Impact scanAll argument
- Support default export and export api type and enable type module
- Use turbopack-loader in webpack mode
- Unused create sheets is removed
- Update scanAll and variants

## 7.1.2 (Jan 27, 2026)

- Fix variants optional revival

## 7.1.1 (Jan 26, 2026)

- Zss-engine v2.2.4 update

## 7.1.0 (Jan 26, 2026)

- Deep nesting support and optimized
- Update error function and all static
- Variants performance o(n^k) to o(n)
- Variant.ts processVariants

## 7.0.1 (Jan 20, 2026)

- Readme add no-combinator rule

## 7.0.0 (Jan 19, 2026)

- Minor refactoring for major changes
- New api marker and extended

## 6.3.2 (Jan 18, 2026)

- Variants changed arguments from optional to required
- Bit expression changed to sum of products

## 6.3.1 (Jan 16, 2026)

- Variants objects now disappear
- Fixed issue where keyframes were not inlined in edge cases such as cross-files

## 6.3.0 (Jan 14, 2026)

- Fix createTheme export HMR logic and compiling

## 6.2.1 (Jan 12, 2026)

- CreateStatic and createTheme expand even with export

## 6.2.0 (Jan 11, 2026)

- Fixed missing hashMap value for styles
- Treat pseudos as atomic, combinators are semantic

## 6.1.2 (Jan 10, 2026)

- Support namespace import and named export

## 6.1.1 (Jan 10, 2026)

- The timing of local tables and import tables is handled in the same process with scanAll

## 6.1.0 (Jan 9, 2026)

- Support namespace import
- Removed x api, I'll use React inline style from now on

## 6.0.2 (Jan 9, 2026)

- Hmr and atom output improvements

## 6.0.1 (Jan 9, 2026)

- Fix Patch 6.0.1 conditional style merging

## 6.0.0 (Jan 8, 2026)

- By creating an intermediate table, the create hash map has completely disappeared.
- With the implementation of the variant API, static "create" and "props" no longer work at runtime.
- This makes compiling build-only
- Added variants and create tables, the loader will completely wipe them when collected and extracted.

## 5.0.1 (Jan 6, 2026)

- Fixed HMR restoring from the cache table failed.

## 5.0.0 (Jan 6, 2026)

- The core is now ESM-only, and no longer supports cjs syntax calls.
