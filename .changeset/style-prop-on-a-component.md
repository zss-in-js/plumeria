---
'@plumeria/utils': minor
---

- A component can take a style through a prop named the same as the one elements take, which is the spelling the `StyleProps`, `WithoutProperties` and `StaticStyles` references show. The call site is handed the key the component's lookup table is built to resolve, instead of resolving the classes and renaming the attribute to one the component never reads
- Decide that from the component's own declaration rather than from the call sites that pass to it. A component outside the project is never scanned, so it is absent from the table and keeps the element's reading — which is what one forwarding `className` to its own element needs, and what 19.1.7 got wrong by reading a table the call sites themselves filled
- Fall back to the element's reading for a call site the scan has no entry for, rather than emitting an attribute nothing resolves
