---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Scan a project whose imports go through a module that re-exports many names without slowing down as the project grows. Every import resolved through such a module copied its whole export list, so editing that module, a cold scan and the scan behind each transform cost more than linear time: in a project of 4,000 files around one barrel, a rescan after editing the barrel took about 300 ms and now takes about 55 ms, and a cold scan went from about 390 ms to about 110 ms. The scan now reads only the name it resolves
- Read the files a scan has to parse again in parallel once there are 512 or more of them, as the scan already does for their timestamps
