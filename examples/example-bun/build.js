import plumeria from '@plumeria/unplugin';

await Bun.build({
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  plugins: [plumeria.bun()],
});
