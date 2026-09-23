import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';

const root = process.cwd();
const stub = join(root, 'lib', 'node-stub.cjs');
const pathPolyfill = createRequire(import.meta.url).resolve('path-browserify');

const nodeBuiltins = [
  'fs',
  'fs/promises',
  'os',
  'module',
  'url',
  'util',
  'assert',
  'crypto',
  'child_process',
  'worker_threads',
  'perf_hooks',
  'inspector',
  'v8',
  'tty',
  'stream',
  'buffer',
  'events',
  'process',
  'vm',
  'zlib',
  'http',
  'https',
  'net',
  'tls',
  'dns',
  'readline',
  'string_decoder',
  'timers',
  'constants',
  'querystring',
];

const nodeOnlyPackages = ['jiti', 'file-entry-cache', 'flat-cache', 'keyv', 'fdir', 'tinyglobby'];

const stubbed = new Set([...nodeBuiltins, ...nodeBuiltins.map((name) => `node:${name}`), ...nodeOnlyPackages]);

const stubPlugin = {
  name: 'node-stub',
  setup(build) {
    build.onResolve({ filter: /.*/ }, ({ path }) => {
      if (stubbed.has(path)) return { path: stub };
      if (nodeOnlyPackages.some((name) => path.startsWith(`${name}/`))) return { path: stub };
      return null;
    });

    build.onResolve({ filter: /^(node:)?path$/ }, () => ({ path: pathPolyfill }));

    build.onResolve({ filter: /config-loader$/ }, ({ importer }) => {
      return importer.includes(`${sep}eslint${sep}lib${sep}`) ? { path: stub } : null;
    });
  },
};

await build({
  entryPoints: [join(root, 'app', '(home)', 'playground', 'engine-entry.ts')],
  outfile: join(root, 'public', 'playground', 'engine.mjs'),
  bundle: true,
  format: 'esm',
  minify: true,
  banner: {
    js: [
      'var require = void 0;',
      'var __filename = "/playground.tsx";',
      'var __dirname = "/";',
      'var process = {',
      '  argv: [],',
      '  env: {},',
      '  platform: "browser",',
      '  version: "v22.0.0",',
      '  versions: { node: "22.0.0" },',
      '  cwd: () => "/",',
      '  hrtime: Object.assign(() => [0, 0], { bigint: () => 0n }),',
      '  emitWarning: () => {},',
      '  on: () => {},',
      '  nextTick: (fn) => queueMicrotask(fn),',
      '};',
    ].join('\n'),
  },
  platform: 'browser',
  target: 'es2022',
  plugins: [stubPlugin],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});

const outfile = join(root, 'public', 'playground', 'engine.mjs');
const bundled = await readFile(outfile, 'utf8');
const dynamicImport = /async function ([\w$]+)\(([\w$]+)\)\{return\(await import\(\2\)\)\.default\}/g;
const matches = bundled.match(dynamicImport) ?? [];

if (matches.length !== 1) {
  throw new Error(`[playground] expected 1 dynamic import shim, found ${matches.length}`);
}

await writeFile(outfile, bundled.replace(dynamicImport, 'async function $1($2){throw new Error("unsupported: "+$2)}'));

console.log('[playground] engine built');

const previewDir = join(root, 'public', 'playground', 'preview');
const previewSrc = join(root, 'app', '(home)', 'playground', 'preview');

await build({
  entryPoints: [
    join(previewSrc, 'react.ts'),
    join(previewSrc, 'react-dom-client.ts'),
    join(previewSrc, 'jsx-runtime.ts'),
    join(previewSrc, 'jsx-dev-runtime.ts'),
    join(previewSrc, 'core.ts'),
    join(previewSrc, 'boot.ts'),
  ],
  outdir: previewDir,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  platform: 'browser',
  target: 'es2022',
  plugins: [stubPlugin],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});

await writeFile(
  join(previewDir, 'index.html'),
  `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; height: 100%; background: transparent; }
      body { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
      #root { box-sizing: border-box; min-height: 100%; display: grid; align-items: center; padding: 40px 24px; }
      #status:empty { display: none; }
      #status { padding: 24px; color: #b42318; white-space: pre-wrap; }
    </style>
    <script type="importmap">
      {
        "imports": {
          "react": "/playground/preview/react.mjs",
          "react/jsx-runtime": "/playground/preview/jsx-runtime.mjs",
          "react/jsx-dev-runtime": "/playground/preview/jsx-dev-runtime.mjs",
          "react-dom/client": "/playground/preview/react-dom-client.mjs",
          "@plumeria/core": "/playground/preview/core.mjs"
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="status"></div>
    <script type="module" src="/playground/preview/boot.mjs"></script>
  </body>
</html>
`,
);

console.log('[playground] preview runtime built');
