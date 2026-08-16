---
'@plumeria/codemod': patch
---

- Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.
