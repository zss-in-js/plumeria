jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  stat: { color: 'red' },
  palette: (color: string) => ({ color }),
});

${body}
`;

const run = (body: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, wrap(body));
  });

describe('turbopack-loader: dynamic function keys', () => {
  it('resolves a prop argument into a class name and a CSS variable', async () => {
    const code = await run(
      'export const A = (p: any) => <div classStyle={s.palette(p.c)} />;',
    );
    expect(code).toContain('className={"xokp0532"}');
    expect(code).toContain('"--x80848wl-color"');
  });

  it('rejects a call handed to a component prop', async () => {
    // The create call is replaced by an object of static keys only, so the
    // call would survive into the output and throw at runtime.
    await expect(
      run('export const A = (p: any) => <Box styleArray={s.palette(p.c)} />;'),
    ).rejects.toThrow(
      'Plumeria: s.palette(p.c) is only supported in the classStyle prop.',
    );
  });
});
