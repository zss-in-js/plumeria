---
'@plumeria/compiler': minor
'@plumeria/eslint-plugin': minor
'@plumeria/next-plugin': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- `@plumeria/compiler` is now written in Rust with napi-rs. One native module scans the project, transforms each file, compiles the production sheet and minifies it with lightningcss, and replaces the TypeScript compiler built on `@swc/core`, `@rust-gear/glob`, `zss-engine`, `postcss` and `lightningcss`. Prebuilt binaries ship for macOS, Linux (glibc, musl and armv7), Windows, Android, FreeBSD and `wasm32-wasi`, and the package requires Node.js 20 or later
- `@plumeria/turbopack-loader`, `@plumeria/unplugin` and `@plumeria/eslint-plugin` scan, transform and resolve through `@plumeria/compiler` instead of `@plumeria/utils`
- `@plumeria/compiler` also exports `transformSource`, `scanAll`, `optimizer`, `needsCompile`, `resolvePropertyPolicy`, `resolveImportPath`, `resolveExport`, `resolveExportValue`, `getStyleRecords`, `themeHashOf`, `createTheme` and `DEFAULT_STYLE_PROP`
- `@plumeria/utils` keeps the TypeScript implementation and adds `compileCSS`, the previous `@plumeria/compiler` entry point
