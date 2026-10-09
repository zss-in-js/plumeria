import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-unitless-')),
  );

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  const compile = (style: string) => {
    fs.writeFileSync(
      path.join(DIR, 'app.tsx'),
      `import * as css from '@plumeria/core';\nconst s = css.create({ a: { ${style} } });\nexport const x = css.use(s.a);\n`,
    );
    return compileCSS({ include: ['app.tsx'], exclude: [], cwd: DIR });
  };

  it('keeps line counts and orders unitless', () => {
    const css = compile(
      'lineClamp: 2, readingOrder: 1, flexLineCount: 3, maxLines: 4',
    );
    expect(css).toContain('line-clamp: 2;');
    expect(css).toContain('reading-order: 1;');
    expect(css).toContain('flex-line-count: 3;');
    expect(css).toContain('max-lines: 4;');
  });

  it('keeps the -webkit- forms of unitless properties unitless', () => {
    const css = compile(
      'WebkitLineClamp: 2, WebkitBoxFlex: 1, WebkitBoxOrdinalGroup: 2, WebkitFlexGrow: 1, WebkitOrder: 3',
    );
    expect(css).toContain('-webkit-line-clamp: 2;');
    expect(css).toContain('-webkit-box-flex: 1;');
    expect(css).toContain('-webkit-box-ordinal-group: 2;');
    expect(css).toContain('-webkit-flex-grow: 1;');
    expect(css).toContain('-webkit-order: 3;');
  });

  it('still appends px to lengths', () => {
    expect(compile('width: 10')).toContain('width: 10px;');
  });
});
