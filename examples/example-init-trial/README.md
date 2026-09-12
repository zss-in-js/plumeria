# example-init-trial

A bare Vite + React + TypeScript app with no Plumeria in it, kept for trying
[`@plumeria/init`](../../packages/init) against something realistic.

## Running it from this repository

`npx @plumeria/init` fetches the package from npm, so inside this repository use
the workspace binary instead — it is the build in `packages/init/dist`:

```sh
pnpm exec plumeria-init --dry-run   # show the plan, write nothing
pnpm exec plumeria-init             # ask, then write
```

Run `pnpm --filter @plumeria/init build` first if you changed the source.

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
