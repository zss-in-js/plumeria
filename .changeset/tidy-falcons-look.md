---
'@plumeria/eslint-plugin': patch
---

- Feat: `no-order-dependent-overlap` also reports two states written in one style that can match at the same time and set the same property, including two states on one pseudo-element such as `:hover::before` and `:focus::before`. Mutually exclusive states, differing pseudo-elements and pairs already ranked by specificity are left alone. Report only, no suggestion.
