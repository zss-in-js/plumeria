import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { URL } from 'node:url';

const root = join(process.cwd(), 'out');
const vercel = JSON.parse(readFileSync(join(process.cwd(), '..', 'vercel.json'), 'utf8'));
const port = Number(process.env.PORT ?? 3000);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

const toRegExp = (source) =>
  new RegExp(
    `^${source
      .split('(.*)')
      .map((part) =>
        part
          .replace(/[.+?^${}|[\]\\]/g, '\\$&')
          .replace(/\/:(\w+)\*/g, '(?:/(?<$1>.*))?')
          .replace(/:(\w+)\*/g, '(?<$1>.*)')
          .replace(/:(\w+)/g, '(?<$1>[^/]+)'),
      )
      .join('(.*)')}$`,
  );

const rewrites = vercel.rewrites.map(({ source, destination }) => ({ pattern: toRegExp(source), destination }));
const headers = vercel.headers.map(({ source, headers }) => ({ pattern: toRegExp(source), headers }));

const resolveFile = (pathname) => {
  const candidates = [pathname, `${pathname}.html`, join(pathname, 'index.html')];
  for (const candidate of candidates) {
    const file = join(root, candidate);
    if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) return file;
  }
};

createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  for (const { pattern, destination } of rewrites) {
    const match = pattern.exec(pathname);
    if (!match) continue;
    pathname = destination.replace(/:(\w+)\*?/g, (_, name) => match.groups?.[name] ?? '');
    break;
  }

  const extra = Object.fromEntries(
    headers
      .filter(({ pattern }) => pattern.test(pathname))
      .flatMap(({ headers }) => headers.map(({ key, value }) => [key, value])),
  );

  const file = resolveFile(pathname);
  const status = file ? 200 : 404;
  const body = file ?? join(root, '404.html');
  res.writeHead(status, { ...extra, 'Content-Type': types[extname(body)] ?? 'application/octet-stream' });
  createReadStream(body).pipe(res);
}).listen(port, () => {
  console.log(`Serving out/ on http://localhost:${port}`);
});
