# Security Policy

## Supported Dependencies & Environment
Node.js: >=22  
@types/node: >=22.13.11  

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          | Notes                                                                                                       |
| ------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| 0.7.19  | :white_check_mark: | compiler update: It can now be used in conjunction with the css ext.                                     　 |
| 0.7.18  | :white_check_mark: | compiler update: It now runs on a VM, which avoids node.js errors.                                       　 |
| 0.7.15  | :white_check_mark: | style-preset to Replaced by zss-utils                       　　　　　                                     　 |
| 0.7.11  | :white_check_mark: | The Node.js APIs exposed in the Vite environment will be replaced with dynamic imports and the preview will complete successfully. If you are in a Vite environment, please use plumeria vite-plugin's @plumeria/vite.|
| 0.7.10  | :white_check_mark: | @plumeria/collection to Replaced by style-preset            　　　　　                                     　 |
| 0.7.9   | :white_check_mark: | Importing stylesheet is now required. import "@plumeria/core/stylesheet" your app entry points.             |
| 0.7.8   | :white_check_mark: | Fixed Reverted because Next.js's behavior has changed to ESM, rollback ESM use directive.                   |  
| 0.7.7   | :white_check_mark: | Fixed a use directive warning that occurred during build with vite.                                         |
| 0.7.6   | :white_check_mark: | pseudo functions have been migrated to css.pseudo.fn.**.                                                    |
| 0.7.0   | :white_check_mark: | Security update for created code of conduct                                                                 |
| 0.6.9   | :white_check_mark: | Security update for dependencies                                                                            |
| 0.6.8   | :white_check_mark: | Update to zss-engine@0.2.8. The zss-engine added PseudoElementType to css.global.                           |
| 0.6.7   | :white_check_mark: | Update to zss-engine@0.2.7. With zss-engine, d.ts have been separated types and dist.                       |
| 0.6.6   | :white_check_mark: | The type definition has been fixed as @plumeria/collection@0.4.0.                                           |
| 0.6.5   | :x:                | Same as below                                                                                               |
| 0.6.4   | :x:                | The type definition for collection is broken.                                                               |
| 0.6.3   | :x:                | @plumeria/collection@0.2.2 and @plumeria/next@0.4.2 have not included npm to types.                         |
| 0.6.2   | :white_check_mark: | Stopped minifying code and improved security and quality.                                                   |
| 0.6.1   | :white_check_mark: | Dependencies zss-engine updated.                                                                            |
| 0.6.0   | :white_check_mark: | We succeeded in making the compiler independent, which was attempted in 0.3.0.                              |
| 0.5.1   | :white_check_mark: | Problems caused by compression are resolved and created dual packaging.                                     |
| 0.5.0   | :x:                | Excessive compression with minify has caused the use directive to disappear, causing an fs error in NextJS. |
| 0.4.0   | :white_check_mark: | We engaged in a rollback of compiler isolation and temporarily released it as a working version.            |
| 0.3.1   | :x:                | I rolled back the compiler isolation but the potential error persists.                                      |
| 0.3.0   | :x:                | This version does not compile and failed with pnpm.                                                         |
| 0.2.5   | :white_check_mark: | It was relatively stable as a version where core had compiler as a dependency.                              |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it to us at conduct-security@plumeria.dev. We will respond as quickly as possible and work with you to resolve the issue.

## Security Best Practices

- **Regular Updates**: Always use the latest supported version to benefit from the latest security patches.
- **Dependency Management**: Regularly review and update your dependencies to minimize security risks.
- **Security Tools**: Consider using tools like Snyk or Dependabot to monitor and fix vulnerabilities automatically.
