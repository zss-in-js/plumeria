---
'@plumeria/compiler': patch
---

Read selector names as CSS identifiers when computing specificity, so `of` followed by `.` or `#` and escaped names such as `o\66` or `:nth-chil\64 ()` are counted
