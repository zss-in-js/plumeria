---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Index a JSX attribute by its owning element. Resolving the component behind an attribute walked every opening element in the file and re-filtered its attribute list, twice per attribute; the opening-element pass now records each attribute directly
- Index a component's prop entries by call site. Every style expression filtered the project-wide entry list for the component and prop; the entries belonging to the current file are now bucketed by position once per list
- Order the replacements once before resolving deferred sources. Each deferred expression copied and re-sorted the whole replacement list, and the final splice sorted it again
- Overlay the file-local aliases on the scanned tables. Transforming one file copied every keyframes, view transition, create, theme, and static-create entry in the project before adding its own aliases; the aliases now sit on top of the scanned table instead
