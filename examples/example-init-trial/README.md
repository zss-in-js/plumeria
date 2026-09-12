# example-init-trial

A bare Vite + React + TypeScript app with no Plumeria in it, kept for trying
[`@plumeria/init`](../../packages/init) against something realistic.

## Running it from this repository

`@plumeria/init` is a devDependency of the repository root, so npx resolves it
there and runs the build in `packages/init/dist` rather than fetching anything:

```sh
npx @plumeria/init --dry-run   # show the plan, write nothing
npx @plumeria/init             # ask, then write
```

`pnpm exec plumeria-init` is the same binary by name. Either way, run
`pnpm --filter @plumeria/init build` first if you changed the source.

## Starting over

Every file init touches is tracked, so a run is undone with:

```sh
git checkout -- . && git clean -fd .
```

## Not a workspace member

`pnpm-workspace.yaml` excludes this directory. It stands in for a project that
has never seen Plumeria, so it must resolve `@plumeria/*` the way a stranger's
project would rather than through a workspace link — and keeping it out means a
trial run cannot touch the root lockfile.
