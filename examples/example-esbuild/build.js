import esbuild from 'esbuild';
import plumeria from '@plumeria/unplugin';

esbuild
  .build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    plugins: [
      plumeria.esbuild({
        include: /\.[jt]sx?$/,
      }),
    ],
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
    format: 'esm',
    minify: false, // Set to false to inspect output
  })
  .catch(() => process.exit(1));
