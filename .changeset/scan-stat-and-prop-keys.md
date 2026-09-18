---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Share a file's modification time across one scan while resolving exports. Resolving an export checks the file it names on disk, and a barrel re-exported by every consumer was checked once per consumer. The result now lives for the length of the scan and is dropped when it ends, so a rescan reads each file once: about 5% off a rescan that reparses 201 files, and 2% off a cold scan
- Match a component's prop entries through a key set rather than a scan of the ones already collected. Every entry was compared against each one already held, serializing both sides' conditions to do it, so the work grew with the square of the call sites a component is used from. A component used from 1600 call sites scans about 6% faster; below a few hundred the difference is not measurable
