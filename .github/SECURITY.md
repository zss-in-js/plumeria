# Security Policy

## Supported Versions

Specify potential bugs and recommended versions for security purposes.
You can also read it as security update and patch notes.

| Version | Supported          |
| ------- | ------------------ |
| 0.6.8   | :white_check_mark: update to zss-engine@0.2.8. The zss-engine add PseudoElementType to css.global |
| 0.6.7   | :white_check_mark: update to zss-engine@0.2.7. With zss-engine d.ts have been separated types and dist |
| 0.6.6   | :white_check_mark: The type definition has been fixed as @plumeria/collection@0.4.0. |
| 0.6.5   | :x: Same as below |
| 0.6.4   | :x: The type definition for collectioin is broken |
| 0.6.3   | :x: @plumeria/collectioin@0.2.2 and @plumeria/next@0.4.2 has not include npm to types |
| 0.6.2   | :white_check_mark: stopped minifying code and improved security and quality |
| 0.6.1   | :white_check_mark: dependencies zss-engine update |
| 0.6.0   | :white_check_mark: We succeeded in making the compiler independent, which was attempted in 0.3.0.|
| 0.5.1   | :white_check_mark: Problems caused by compression are resolved and created dual packaging. |
| 0.5.0   | :x: Excessive compression with minify has caused the use directive to disappear, causing an fs error in NextJS. |
| 0.4.0   | :white_check_mark: We engaged in a rollback of compiler isolation and temporarily released it as a working version.| 
| 0.3.1   | :x: I rolled back the compiler isolation but the potential error persists.|
| 0.3.0   | :x: This version does not compile is failed with pnpm.|
| 0.2.5   | :white_check_mark: It was relatively stable as a version where core had compiler as a dependency.| 

## Note
Since 0.6.0 the compiler has been made independent, and @plumeria/compiler must be installed when using @plumeria/core.  
From 0.5.x onwards, bundle code has been packages are now CJS ESM compatible.  
It is optimized to some extent depending on the required framework.  
@plumeria/next was unstable for a long time, but it has been stable since 0.3.0. It is now a dual package in 0.4.0.  
Please note that only @plumeria/next@0.4.2, where the type definition was forgotten, cannot be used with typescript.

