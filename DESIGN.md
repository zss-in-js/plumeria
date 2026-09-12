# Design: hand CSS import emission to the host

Status: implemented in `@plumeria@19.1.3`. Kept as the record of why the
emission moved to the host.

## Problem

`core.ts` ends a transform by appending an import for the virtual sheet:

```ts
code: transformedSource + `\nimport ${JSON.stringify(cssId)};`,
```

Three hosts then parse that string back out and rewrite it:

| host                    | pattern                                      | rewritten to                          |
| ----------------------- | -------------------------------------------- | ------------------------------------- |
| `vite.ts` (`devEmitToDisk`) | `/import\s+["'](\/[^"']+\.zero\.css)["'];/g` | relative path to the shared disk file |
| `farm.ts`               | the same pattern                              | the same disk file (near-duplicate)   |
| `webpack.ts`            | `/import\s+"(\/[^"]+\.zero\.css)";/g`         | relative path + `?t=${Date.now()}`    |

Each rewrite depends on the exact spelling core happens to produce — the quote
style, the leading newline, the trailing semicolon. None of them fails loudly.
A change to the emitted string makes the pattern stop matching, the original
import survives, and the sheet resolves to the wrong place with no error.

19.1.3 removed a fourth instance of this in the RSC path by adding
`setSkipCssImport`, which lets the host say "do not emit at all". That fixed one
case with a boolean. The other three need to say "emit this instead", which a
boolean cannot express.

`vite.ts` and `farm.ts` are additionally the same code twice: both resolve
`cssFileLookup`, read `cssLookup`, call `ensureVirtualCssFile`, `writeCssBlock`
and `rewriteImportPath`, and return the rewritten import.

## Proposal

Generalise `setSkipCssImport` from a boolean into a formatter. Core decides
*when* an import is needed; the host decides *what it says*.

```ts
type CssImportContext = {
  id: string;          // module id being transformed
  cssId: string;       // "/src/App.zero.css"
  cssFilename: string; // "/abs/src/App.zero.css"
  css: string;         // the sheet for this module
};

// on __plumeriaInternal, alongside setDev / setRoot
setCssImport(fn: ((ctx: CssImportContext) => string | null) | null): void;
```

Core's transform becomes:

```ts
if (extractedSheets.length > 0) {
  const statement = cssImport
    ? cssImport({ id, cssId, cssFilename, css: optInCSS })
    : `\nimport ${JSON.stringify(cssId)};`;

  return { code: statement ? transformedSource + statement : transformedSource, map: null };
}
```

`null` from the callback means "emit nothing", which subsumes
`setSkipCssImport`. The default (no callback registered) is today's behaviour,
so every host that does not opt in is unaffected.

## Per-host migration

| host                            | today                                   | after                                              |
| ------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `vite.ts` — virtual module      | core emits, host leaves it              | no callback                                         |
| `vite.ts` — `devEmitToDisk`     | core emits, host rewrites by regex      | callback returns the disk import                    |
| `vite.ts` — RSC build           | `setSkipCssImport(true)`                | callback returns `null`                             |
| `farm.ts`                       | core emits, host rewrites by regex      | callback returns the disk import (shared with vite) |
| `webpack.ts`                    | core emits, host rewrites by regex      | callback returns the relative import + `?t=`        |
| `rspack.ts`                     | re-exports webpack                      | unchanged                                           |
| `esbuild.ts` `bun.ts`           | never touch the import                  | unchanged, no callback                              |
| `rollup.ts` `rolldown.ts` `unloader.ts` | 4-line re-exports               | unchanged, no callback                              |

The vite and farm callbacks are the same function. It moves to `disk-css.ts`,
which already owns `ensureVirtualCssFile`, `writeCssBlock` and
`rewriteImportPath`, and both hosts register it.

## What this removes

- three regexes over generated code, and the silent-failure mode they carry
- the duplicated disk-rewrite body in `vite.ts` and `farm.ts`
- `setSkipCssImport`, folded into the more general hook
- the `result.code.includes('.zero.css')` guards that exist only because the
  import is the signal that a module produced a sheet — the callback firing is
  that signal

## Timing

`setCssImport` can be called at plugin construction, unlike `setSkipCssImport`,
which had to wait for `config()` because `isRsc` is not known earlier. The
callback runs per module at transform time, so anything it closes over is read
late: `vite.ts` can register one function that returns `null` when
`isRsc && isBuild`, the disk import when `useDiskEmit`, and otherwise nothing to
override. No flag has to be set before the first transform.

## Risks

- It touches `core.ts`, `vite.ts`, `farm.ts` and `webpack.ts` in one behavioural
  refactor. Output must be byte-identical; the check is a build of every example
  before and after, comparing asset hashes.
- `webpack.ts` puts `Date.now()` in the import. That timestamp is per transform
  call, and must stay per transform call rather than being hoisted into the
  registration.
- The existing suites that cover this: `webpack-coverage`, `vite-coverage`,
  `adapter-hooks`, `disk-css`, `theme-hmr`. A case per host asserting the exact
  emitted statement is worth adding first, so the refactor is checked against
  something.

## Non-goals

- Changing what core computes. `cssLookup`, `cssFileLookup`, `targets` and the
  dev accumulation stay where they are.
- Moving the transform itself. That already happened in 19.1.1.
- Removing `__plumeriaInternal`. Late-bound host state is the right shape here;
  this proposal only makes one of its members expressive enough for its callers.
