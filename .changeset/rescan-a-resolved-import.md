---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Scan a file again once an import that resolved to nothing names a real file. Deleting a module a component imports its styles from leaves the importer holding a specifier that resolves nowhere, and restoring the file only scanned the file itself, so the importer was never visited again: a style handed to a child through a prop stayed missing and the child kept rendering `className=""`. A scan that finds files it has not seen now revisits whatever was left holding an unresolved specifier
