---
'@plumeria/init': patch
---

- Fix: In a project that lints with oxlint only, `init` adds the plugin and its recommended rules to `.oxlintrc.json` instead of writing an `eslint.config` file, and shows the entries to add by hand when the file has comments
