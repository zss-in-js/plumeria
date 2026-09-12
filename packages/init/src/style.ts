import { styleText } from 'node:util';

type Format = Parameters<typeof styleText>[0];

export const paint = (
  stream: NodeJS.WritableStream,
  format: Format,
  text: string,
): string => styleText(format, text, { validateStream: true, stream });

const on =
  (stream: NodeJS.WritableStream) =>
  (format: Format) =>
  (text: string): string =>
    paint(stream, format, text);

const out = on(process.stdout);
const err = on(process.stderr);

export const style = {
  ok: out('green'),
  install: out('cyan'),
  write: out('green'),
  patch: out('yellow'),
  manual: out('red'),
  skip: out('dim'),
  strong: out('bold'),
  faint: out('dim'),
  choice: out(['bold', 'cyan']),
  failure: err('red'),
};
