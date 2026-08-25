---
'@plumeria/unplugin': patch
---

- Fix: a style function with a destructured parameter called with no argument — `styles.box()` against `({ tone = 'navy' }) => ...` — aborted the build with an internal `TypeError` instead of compiling. The same call already worked under `@plumeria/turbopack-loader`, and a parameter left without a default is now reported the way a named call with a missing key already was.
