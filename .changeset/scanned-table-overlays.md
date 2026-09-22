---
'@plumeria/compiler': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Take a file's own table aliases from the scan's contribution index. Building the keyframes, view transition, create, theme, and static-create alias maps walked every key of the project-wide table and matched it against the file's path, once per table; the scan already records which keys each file contributed, and the transform and the compiler now read that index
- Hand back the scanned tables that are only read by key as overlays. Every snapshot copied all of them entry by entry; only the tables a caller enumerates are copied now, and the rest sit on a prototype chain over the scanned table
- Overlay a file's local values on the scanned static table. Resolving a dynamic style's parameters, a member expression's root identifier, and a file's local constants each rebuilt the project-wide static table to add a handful of entries
- Read a compile pass's tables through one overlay. Each transform took its own copy of the scanned tables before layering the file's entries on top; a compile now layers over a base that is rebuilt only when the scan changes
