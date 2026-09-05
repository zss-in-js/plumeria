// `Conditional` is `false | CSSProperties | null | undefined`, so a bare
// `false`, `null` or `undefined` is a legal entry that contributes nothing.
// It has to be skipped, not taken as a reason to drop the whole prop: the
// styles written beside it still apply, and so does the element's own
// className, which the transform removes to fold into the generated one.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  p1: { color: 'green' },
  p3: { color: 'teal' },
});

${body}
`;

const run = async (body: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    wrap(body),
    `${__dirname}/fixture.tsx`,
  );
  return result.code;
};

const P1 = 'x3git8yv';
const P3 = 'xxcejlqg';

const NOTHING = ['undefined', 'null', 'false'] as const;

describe('unplugin: an entry that contributes nothing', () => {
  it.each(NOTHING)('keeps the styles written beside %s', async (nothing) => {
    const out = await run(
      `export const A = () => <div classStyle={[s.p1, ${nothing}]} />;`,
    );
    expect(out).toContain(P1);
  });

  it.each(NOTHING)('keeps the element className beside %s', async (nothing) => {
    const out = await run(
      `export const A = () => <div className="keep" classStyle={[s.p1, ${nothing}]} />;`,
    );
    expect(out).toContain('keep');
    expect(out).toContain(P1);
  });

  // Nothing is left to fold the className into, so it has to be left alone.
  it('keeps the element className when the whole prop is undefined', async () => {
    const out = await run(
      `export const A = () => <div className="keep" classStyle={undefined} />;`,
    );
    expect(out).toContain('keep');
  });

  it('preserves className when the style expression cannot be optimized', async () => {
    const out = await run(
      `export const A = () => <div className="keep" classStyle={s.p1 || s.p3} />;`,
    );
    expect(out).toMatch(/className=(?:"keep"|\{"keep"\})/);
  });

  // `use` reads the same argument list as the styling prop.
  it.each(NOTHING)('accepts %s as a css.use() argument', async (nothing) => {
    await expect(
      run(`export const cls = css.use(s.p1, ${nothing});`),
    ).resolves.toContain(P1);
  });

  // A condition that yields nothing already compiles; the bare value must
  // reach the same result.
  it('keeps both sides of a condition that may yield nothing', async () => {
    const out = await run(
      `export const A = ({ o }: { o: boolean }) => <div className="keep" classStyle={[s.p1, o && s.p3]} />;`,
    );
    expect(out).toContain('keep');
    expect(out).toContain(P1);
    expect(out).toContain(P3);
  });
});
