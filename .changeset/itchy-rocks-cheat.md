---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

Fix: drop the asterisk wildcard from style prop attribution

A style application that could not be attributed to a component — one defined inside a wrapper call such as `memo(...)` — was recorded under an asterisk wildcard that matched by prop name across the whole file. A sibling component that only forwarded a prop of the same name slipped past the never-applied check. The wildcard is gone; a prop now counts as applied only inside the component that received it, so those relays fail the build like any other.
