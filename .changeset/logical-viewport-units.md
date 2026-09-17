---
'@plumeria/compiler': patch
'@plumeria/utils': patch
---

- Read `svb`, `svi`, `lvb`, `lvi`, `dvb` and `dvi` as a unit the declaration writes itself, the way the rest of their family already was. `vb` and `vi` were read, and so were `svw`, `svh`, `svmin` and `svmax`, but the block and inline axes of the small, large and dynamic viewport were missing from the list: ``height: `${h}dvb` `` still compiled to `height: var(--v)dvb` and was dropped as invalid. No other CSS unit is left out
