# vite-react-rsc

The Vite end-to-end target for React Server Components: `@vitejs/plugin-rsc`
with the Plumeria Vite plugin, in the shape of
`examples/example-vite-react-rsc`, carrying the styles the tests in
`test-e2e/test/rsc-*.test.ts` read back from the browser.

A server component's styles reach the page by a route no other target takes.
The module is transformed in the `rsc` environment and never loaded in the
browser, so the stylesheet it produces has to be linked by the server render,
answered as CSS when the browser asks for it, and gathered into one sheet for
the whole app in a build.

```
pnpm dev                                    # http://localhost:5173
E2E_TARGET=rsc pnpm test:e2e                # against the dev server
E2E_TARGET=rsc-production pnpm test:e2e     # against the build
```
