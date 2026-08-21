---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: two components declared in one file that receive a style through the same prop name shared one lookup table, so the second rendered with the first one's keys and reached the element with no class at all. Each component now reads the table it owns, in the bundler plugins and in the generated stylesheet alike.
- Fix: a style function's parameter default was read as neither a default nor a name, so `(c = 'red') => ({ color: c })` produced an empty class even when an argument was passed. A default now compiles to the CSS variable's fallback, so `box()` and `box('blue')` share one class and only the second writes an inline style.
- Fix: a style function that takes no parameter resolved to nothing when it was called, so `() => ({ color: 'red' })` left the styling prop off the element entirely. It now compiles to the class its static equivalent would.
- Fix: a style key that is only digits was dropped without a word. `css.create({ 1: { color: 'red' } })` is now reported, the way `@plumeria/no-invalid-selector` already reported it; a quoted `'1'` and a name carrying digits are unaffected.
- Fix: a style key holding a quote or a backslash was written into the run-time lookup table unescaped, which made the compiled module invalid JavaScript.
- Fix: `css.use()` with no arguments, and `css.use()` on a style that cannot be resolved, survived into the output after the `@plumeria/core` import had already been removed, leaving a module that throws on load. The first compiles to an empty class and the second is reported.
- Fix: `css.keyframes()` with no argument aborted the transform with an internal error instead of being skipped, the way `create()` and `viewTransition()` already are.
- Update: the style prop table is read by the owning component's key rather than scanned, so a project with many components generates its stylesheet faster — 44ms against 83ms on a 400-component benchmark.
