# Release Notes

## 18.2.11 (Aug 13, 2026)

- Fix: `no-order-dependent-overlap` to report the third pair the specificity graph leaves to source order. Two media queries written in one style, where one provably matches a subset of the other — `(min-width: 900px)` inside `(min-width: 600px)` — and the narrower one written first, mean the broader one wins wherever they meet, which is the opposite of what writing the narrower query meant. Whether one condition implies another is not decidable in general, so no depth is assigned to a condition and only the comparable subset is read: a single numeric `min-` or `max-` range, on one axis, in one unit. A compound query, a keyword query, `@supports` and `@container` are left alone. The swap is offered as a suggestion rather than a fix, and the stylesheet settles the pair regardless — what the rule reports is that the source reads the wrong way round.

- Fix: `@plumeria/utils` to place a conditional at-rule after every condition that contains it while optimizing. A query matching a subset of another is the more specific of the two, the same way a longhand is more specific than the shorthand covering it, and until now that pair was left to the order the atoms happened to be emitted in: the `classStyle` array usually, or the file the compiler reached first where one of the two was also used on its own. Specificity cannot carry the ranking, because whether one condition implies another is undecidable in general, so the pair is ordered instead — the narrower one last, where it wins everywhere both of them reach. This supersedes the note added in 18.2.6 that conditions are never sorted against each other.

- Fix: `zss-engine@2.5.0` reads a condition as the interval of viewports, or of container sizes, that it matches, so one condition implying another is the same question in every shape it can be written in: `min-` and `max-` prefixes, the `>=` comparison form, the two-sided form, several joined with `and`, on `width`, `height`, `inline-size` or `block-size`. A media type or a container name has to match, and a query it cannot read — `not`, `only`, a comma, `style()`, a feature that is not a size, an unknown unit — ranks against nothing. `no-order-dependent-overlap` reads a pair through the same function, so what the rule reports and what the stylesheet does cannot drift apart, and it now covers `@container` alongside `@media`.

Note: a pair the optimizer can compare may move a condition it cannot compare, because no arrangement satisfies the ranking and holds every other pair still. Two conditions that overlap without either containing the other, such as `600px` to `900px` against `700px` to `1000px`, are still decided by source order.

## 18.2.10 (Aug 13, 2026)

- Feat: `@plumeria/eslint-plugin` adds `expand-border-shorthands`, which rewrites a border shorthand that bundles a width, a style and a color into the three declarations it stands for. Every pair `no-order-dependent-overlap` cannot rank contains one of those eleven bundles, so expanding them turns the last unrankable overlaps into ordinary shorthand-to-longhand pairs that specificity settles: `borderTop` against `borderBlockWidth` is a crossing, `borderTopWidth` against `borderBlockWidth` is a containment. The rule is fixable, because writing the three components out is the same declaration set the shorthand already produced, and a shorthand resets what it omits so the expansion writes `medium`, `none` and `currentcolor` where the author left a component out. A value that cannot be split, such as `var(--edge)` or `inherit`, is reported without a fix rather than passed over, since the declarations expanded elsewhere would otherwise outrank it silently. Not part of `recommended`.

## 18.2.9 (Aug 13, 2026)

- Fix: `@plumeria/compiler` to sort the file list it globs, so the stylesheet is emitted in a stable order rather than the order the filesystem happened to enumerate the directories in. A rule is recorded the first time it is reached, so a pair that no specificity can rank — one property written under both its logical and its physical name, or two shorthands that cross — was settled by whichever file the glob returned first. That order is not alphabetical, and a fresh clone lays a directory out differently from a working checkout, so the same source could produce a different stylesheet on CI than it did locally. The scan pass is sorted as well.

- Feat: `@plumeria/eslint-plugin` adds `no-physical-properties` and `no-logical-properties`, which keep a project on one spelling of the properties that carry both a logical and a physical name. `no-order-dependent-overlap` reports a pair once both spellings meet on an element; writing one spelling and not the other makes that pair impossible to write in the first place. Either direction removes the pairs that name one property twice, which is the half a project actually meets; what neither can reach is a border shorthand that has no single counterpart, such as `borderBlockWidth` against `borderTop`, so `no-order-dependent-overlap` keeps reporting those. Both take `{ sizes }`, which is `false` by default and adds `width`, `height`, their `min` and `max` forms, `overflow-x` and `overflow-y` when set: an edge is what a direction reverses, a size is one property under either spelling. Neither is part of `recommended`.

Note: sorting does not rank a pair that specificity leaves tied; it only makes the outcome the same on every machine. A pair of spellings is also one property in a horizontal writing mode and two properties in a vertical one, and which one an element renders under is inherited at runtime, so `no-order-dependent-overlap` reads such a pair as one property and a line that is known to be vertical should disable it.

## 18.2.8 (Aug 13, 2026)

- Feat: `@plumeria/eslint-plugin` adds `no-order-dependent-overlap`, which reports two properties written in one style that overlap while neither one outranks the other. Every pair where one property contains the other is settled by specificity and is left alone; what remains is one property written under both its logical and its physical name, such as `paddingTop` beside `paddingBlockStart`, and two shorthands that cross without either containing the other, such as `borderTop` beside `borderBlockWidth`. Those pairs are decided by the order they are written, which is stable inside one style object and up to the bundler once the pair is split across two files. The rule is `warn` in `recommended`.

- Fix: `zss-engine@2.4.3` registers `corner-shape` and the eight corner longhands it sets, which were typeable but carried no depth at all, so `cornerShape` and `cornerTopLeftShape` left the stylesheet order to decide the winner while the identically shaped `border-radius` was already settled by specificity. The shorthand graph is also exported, so the ESLint rule ranks a pair from the same data the compiler generates the stylesheet from.

Note: an alias pair carries a suggestion for each side and the rule has no autofix. Removing one half of a crossing pair would drop the values the other half never set, and the two spellings of an alias pair are the same property only in a horizontal writing mode, so neither edit is safe to apply in bulk.

Note: the corner longhands now receive one `:not(#\#)` where they received none. Class names are unaffected.

## 18.2.7 (Aug 12, 2026)

- Fix: `@plumeria/core` to expose `overflowInline` instead of `overflowBlockX`. CSS has no `overflow-block-x` property; the logical counterpart of `overflow-x` is `overflow-inline`, and the type was reachable under a name that does not exist.

- Fix: `zss-engine@2.4.2` aligns the shorthand graph with the logical property groups, so a property no longer ties with the shorthand that covers it. `paddingTop` and `paddingBlock` shared a depth and left the stylesheet order to decide whether the longhand survived; the physical edges now sit below the axis shorthand that sets them, across `margin`, `padding`, `inset`, `scroll-margin`, `scroll-padding`, and the `border` axes. `overflow` and `overscroll-behavior` gained the logical longhands they were missing, which had carried no depth at all, and `containIntrinsicSize`, `positionTry`, `marker`, `cue`, `pause`, and `rest` are registered as shorthands.

Note: these depths decide how many `:not(#\#)` selectors an atomic class receives, so the generated stylesheet changes for the properties listed above. Class names are unaffected.

## 18.2.6 (Aug 12, 2026)

- Fix: `@plumeria/utils` to give a nested selector inside a conditional rule both the nested depth and the condition depth. Previously a nested selector received a single `:not(#\#)` whether or not it sat inside `@media`, `@container`, or `@supports`, so a declaration such as `@media { ':hover': ... }` tied with a bare `':hover'` on specificity and the winner depended on the order the rules happened to be emitted. The condition now contributes its own depth, so the conditional declaration wins regardless of where it appears in the stylesheet. Custom properties stay exempt and receive no depth.

- Fix: `@plumeria/utils` to move conditional at-rules after base rules while optimizing. A base longhand and a conditional shorthand can still land on the same specificity, because property depth and condition depth share one scale, and until now the stylesheet order decided that pair. `@media`, `@container`, `@supports`, `@layer`, and `@scope` are now hoisted as a stable partition, so the conditional declaration wins and the same style object produces the same result no matter which order its keys were written in. Conditions are never sorted against each other, so overlapping conditions keep resolving by source order, and at-rules that carry no condition depth such as `@keyframes` are left where they are.

## 18.2.5 (Aug 12, 2026)

- Fix: `@plumeria/utils` to preserve shorthand and longhand declarations as independent atoms, and merge identical selectors and at-rules without reordering them during optimization.

- Fix: `@plumeria/turbopack-loader` to optimize its accumulated development virtual stylesheet so duplicate selectors and at-rules are merged consistently.

- Fix: `zss-engine@2.4.1` The override longhand behavior has been removed. The behavior within styles that crushed longhand when shorthand was written below it has been abolished, and it has been standardized so that longhand is added regardless of the order in which it is written. This is because JavaScript objects do not need to reproduce CSS cascading, and Plumeria determines everything simply by satisfying the merge rules. If you are using ESLint's recommended rules, this change will not affect you, so it will be treated as a patch update.

- Fix: Logical longhand properties now receive specificity based on their depth in the shorthand graph. For example, `padding-block-start` receives two `:not(#\#)` selectors in base styles and three inside conditional rules.

- Update: Generated base and conditional styles no longer depend on moving media queries to the end of the stylesheet. Their priority is controlled by specificity, so development and production preserve the same behavior while optimization can merge duplicate rules without sorting conditions.

## 18.2.4 (Aug 11, 2026)

- Fix: drop the asterisk wildcard from style prop attribution
A style application that could not be attributed to a component — one defined inside a wrapper call such as `memo(...)` — was recorded under an asterisk wildcard that matched by prop name across the whole file. A sibling component that only forwarded a prop of the same name slipped past the never-applied check. The wildcard is gone; a prop now counts as applied only inside the component that received it, so those relays fail the build like any other.

## 18.2.3 (Aug 11, 2026)

- Fix: Reject a style prop that is never applied, and resolve one applied under a condition
A component may receive a style through a prop and apply it to an element it
renders, on its own or merged under a base style. A style prop that is never
applied now fails the build instead of silently dropping the style, which is
what passing it on to another component did.
`classStyle={[styles.base, cond && styleArray]}` and
`classStyle={cond ? styleArray : styles.base}` now compile as well. The styles
a prop's call sites pass are carried through the condition, and a closed gate
leaves the surrounding styles in place.

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
