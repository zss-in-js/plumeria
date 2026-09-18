---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Read a relative import written for `NodeNext` as the file it names. Under `moduleResolution` set to `node16` or `nodenext` a relative specifier has to carry the `.js` extension TypeScript will emit, so `./styles.js` was looked for on disk exactly as written and never reached `styles.ts`: a `create` or a `keyframes` declared there was left out of the sheet and the element lost the class, while the build still passed. A `.js` specifier now falls back to `.ts` and `.tsx`, and `.jsx` to `.tsx`, only where the file it names is not itself written
