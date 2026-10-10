---
'@plumeria/core': patch
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
'@plumeria/unplugin': patch
---

- Fix: `validate-values` accepts math functions nested inside each other, such as `min(100%, calc(50% + 10px))` and `repeat(auto-fill, minmax(min(100%, 200px), 1fr))`
- Fix: `validate-values` accepts `calc()` and other math functions inside transform functions and `flex`, such as `translate(calc(100% - 1px), 0)` and `1 1 calc(50% - 1rem)`
- Fix: `validate-values` accepts the container query units such as `cqi`, the `svb`, `lvi` and `dvb` viewport units, and the lowercase `currentcolor`
- Fix: `validate-values` accepts relative colors such as `oklch(from var(--brand) l c calc(h + 180))`, and `color-mix()` and `light-dark()` nested inside each other
- Fix: `validate-values` accepts `image-set()` in `backgroundImage`, `background` and the other image properties
- Fix: `validate-values` accepts several items in `content`, such as `"(" counter(item) ")"` and `url(a.png) / "alt"`
- Fix: `validate-values` accepts `round()`, `mod()`, `rem()` and `abs()` where lengths are allowed
- Fix: `validate-values` accepts numbers written without the leading zero, such as `.5px`, `-.5rem` and `cubic-bezier(.4, 0, .2, 1)`
- Update: README.md
