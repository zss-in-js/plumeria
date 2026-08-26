# @plumeria/turbopack-loader

The loader that compiles Plumeria styles in a Next.js build, under Turbopack and webpack alike. It is installed and wired by [`@plumeria/next-plugin`](https://www.npmjs.com/package/@plumeria/next-plugin), which is where a build is set up and where the options it takes are documented.

There is one reason to install it yourself: it is exported as a plain function, so a test can call it and assert on the compiled output with no bundler in between. See [Testing](https://plumeria.dev/docs/testing) for the example. If you are looking for Plumeria itself, start at [`@plumeria/core`](https://www.npmjs.com/package/@plumeria/core).

## API Stability

**Stability: Frozen** — the signature will not change; behaviour may still be corrected.
See [API Stability](https://github.com/zss-in-js/plumeria#api-stability).

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
