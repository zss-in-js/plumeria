---
'@plumeria/utils': patch
---

- Fix a bracket group losing the other groups' styles when the selected key carries none of the conflicting properties, because the combination table had no cell for that key
- Split the conflicting-property combination table into connected components, so groups that never override each other no longer multiply into one product
