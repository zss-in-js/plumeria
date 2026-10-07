---
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
---

- `@plumeria/next-plugin` starts the build lint only when the running bin is `next`, not when any path holds a `next` directory
- `@plumeria/eslint-plugin/guard` no longer exports `GUARD_ENV` and `SpellingOptions`
