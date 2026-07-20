# Release Notes

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
