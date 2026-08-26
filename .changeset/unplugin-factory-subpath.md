---
'@plumeria/unplugin': minor
'@plumeria/turbopack-loader': minor
---

- Feat: add the `@plumeria/unplugin/factory` subpath, which hands back the transform as a plain function, so a test compiles a source string and reads the class names and the stylesheet out of it with no bundler in between. The bundler entries reach `unplugin` itself, which is ESM and cannot be required from a CommonJS runner; the factory carries only a type import of it, and loads under Jest as it stands.
- Update: `@plumeria/turbopack-loader` declares `exports` rather than leaning on `main`. The entry and `zero-virtual.css` are named — the two `@plumeria/next-plugin` resolves, and the two a test driving the loader directly reaches — where nothing else under `dist/` was ever referenced.
