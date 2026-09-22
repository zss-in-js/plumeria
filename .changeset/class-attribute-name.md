---
'@plumeria/compiler': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Order the transform ahead of the framework plugins. The plugin declared `enforce: 'pre'`, which only wins against plugins that do not, so a framework plugin that also enforces pre and was listed first compiled the JSX away before Plumeria ever saw the style prop; the transform hook now declares its own `order: 'pre'`, and the Vite adapter keeps that order when it rewraps the hook. Solid was the visible case — the style prop produced no class and no CSS at all
- Write the class attribute a non-React renderer reads. The style prop rewrite emitted `className`, which only reaches the DOM on renderers that alias it, so on Solid the class silently never landed and the CSS never applied; the Vite adapter now recognises a Solid build from its resolved plugins and writes `class` instead, under the same name it reads an existing attribute to merge with. Dynamic function keys keep their companion `style` attribute either way, and a React build is unchanged
