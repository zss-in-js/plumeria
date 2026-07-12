import esbuild from 'esbuild';
import plumeria from '@plumeria/unplugin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const jsPath = path.resolve(distDir, 'index.js');

async function run() {
  // 1. Build using esbuild
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
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
    define: {
      'process.env.NODE_ENV': 'process.env.NODE_ENV',
    },
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@plumeria/core',
      '@plumeria/headlessui',
    ],
  });

  // 2. Inline CSS
  const files = fs.readdirSync(distDir);
  const cssFile = files.find((f) => f.endsWith('.css'));

  if (cssFile) {
    const cssPath = path.resolve(distDir, cssFile);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    const jsContent = fs.readFileSync(jsPath, 'utf-8');

    const updatedJsContent = jsContent.replace(
      '"__INLINE_CSS__"',
      JSON.stringify(cssContent),
    );

    fs.writeFileSync(jsPath, updatedJsContent, 'utf-8');
    fs.unlinkSync(cssPath);
    console.log(
      `Successfully inlined ${cssFile} into JS bundle and cleaned up CSS file.`,
    );
  } else {
    console.log('No CSS file found to inline.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
