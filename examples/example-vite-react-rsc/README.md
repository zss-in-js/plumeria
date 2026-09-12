# example-vite-react-rsc

Plumeria on [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc),
based on the plugin's `starter` example.

```sh
pnpm dev
pnpm build && pnpm preview
```

`src/root.tsx` is a server component and `src/client.tsx` is a client component;
both use `css.create` so the RSC CSS paths can be exercised from one page.
