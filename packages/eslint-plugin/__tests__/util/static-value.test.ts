import * as fs from 'fs';
import * as path from 'path';
import { Linter } from 'eslint';
import type { Rule } from 'eslint';
import * as parser from '@typescript-eslint/parser';
import { staticValueResolver } from '../../src/util/staticValue';

const DIR = fs.mkdtempSync(path.join(__dirname, 'fixture-'));
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

const write = (name: string, source: string) =>
  fs.writeFileSync(path.join(DIR, name), source);

write(
  'tokens.ts',
  `import * as css from '@plumeria/core';
export const query = '@media (width >= 640px)' as const;
export const pseudo: string = ':hover';
export const bp = css.createStatic({ md: '@media (width >= 768px)' });
export const plain = { sm: '@media (width >= 480px)' };
export default ':focus';`,
);
write('barrel.ts', `export { query as renamed } from './tokens';`);
write(
  'relay.ts',
  `import { pseudo } from './tokens';
export { pseudo };`,
);
write(
  'named.ts',
  `import { createStatic } from '@plumeria/core';
export const bp = createStatic({ lg: '@media (width >= 1024px)' });`,
);

const probe: Rule.RuleModule = {
  create(context) {
    const staticValue = staticValueResolver(context);
    return {
      Property(node) {
        if (!node.computed) return;
        context.report({
          node,
          message: JSON.stringify(staticValue(node.key) ?? null),
        });
      },
    };
  },
};

const resolveKeys = (code: string) => {
  const linter = new Linter({ configType: 'flat' });
  return linter
    .verify(
      code,
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser },
          plugins: { probe: { rules: { probe } } },
          rules: { 'probe/probe': 'error' },
        },
      ],
      path.join(DIR, 'app.ts'),
    )
    .map((message) => JSON.parse(message.message));
};

describe('staticValueResolver', () => {
  it('reads literals and constants declared in the file', () => {
    expect(
      resolveKeys(`
        const q = '@media (width >= 640px)';
        const alias = q;
        const annotated: string = ':hover';
        const asserted = ':focus' as const;
        const satisfied = ':active' satisfies string;
        const tpl = \`:visited\`;
        function f() {
          const inner = ':checked';
          return { [inner]: {} };
        }
        ({
          ['::before']: {},
          [q]: {},
          [alias]: {},
          [annotated]: {},
          [asserted]: {},
          [satisfied]: {},
          [tpl]: {},
        });
      `),
    ).toEqual([
      ':checked',
      '::before',
      '@media (width >= 640px)',
      '@media (width >= 640px)',
      ':hover',
      ':focus',
      ':active',
      ':visited',
    ]);
  });

  it('reads members of createStatic and plain objects in the file', () => {
    expect(
      resolveKeys(`
        import * as css from '@plumeria/core';
        import { createStatic } from '@plumeria/core';
        const bp = css.createStatic({ md: '@media (width >= 768px)' });
        const named = createStatic({ lg: '@media (width >= 1024px)' } as const);
        const plain = { sm: '@media (width >= 480px)' };
        ({ [bp.md]: {}, [named.lg]: {}, [plain.sm]: {}, [plain['sm']]: {} });
      `),
    ).toEqual([
      '@media (width >= 768px)',
      '@media (width >= 1024px)',
      '@media (width >= 480px)',
      '@media (width >= 480px)',
    ]);
  });

  it('follows imports to the declaring file', () => {
    expect(
      resolveKeys(`
        import focus, { query, pseudo, bp, plain } from './tokens';
        import * as tokens from './tokens';
        import { renamed } from './barrel';
        import { pseudo as relayed } from './relay';
        import { bp as named } from './named';
        ({
          [query]: {},
          [pseudo]: {},
          [bp.md]: {},
          [plain.sm]: {},
          [focus]: {},
          [tokens.query]: {},
          [renamed]: {},
          [relayed]: {},
          [named.lg]: {},
        });
      `),
    ).toEqual([
      '@media (width >= 640px)',
      ':hover',
      '@media (width >= 768px)',
      '@media (width >= 480px)',
      ':focus',
      '@media (width >= 640px)',
      '@media (width >= 640px)',
      ':hover',
      '@media (width >= 1024px)',
    ]);
  });

  it('evaluates numbers and binary expressions', () => {
    expect(
      resolveKeys(`
        const n = 123;
        ({
          [n]: {},
          [1 + 1]: {},
          [4 - 1]: {},
          [2 * 3]: {},
          [8 / 2]: {},
          [7 % 4]: {},
          [2 ** 3]: {},
          [':' + 'hover']: {},
          [1 << 2]: {},
          ['a' - 1]: {},
        });
      `),
    ).toEqual([123, 2, 3, 6, 4, 3, 8, ':hover', null, null]);
  });

  it('leaves values it cannot pin down unresolved', () => {
    expect(
      resolveKeys(`
        import { missing } from './tokens';
        import { query } from 'some-package';
        let mutable = ':focus';
        const call = String(':hover');
        const bp = { md: '@media' };
        const rest = { ...bp, get lg() { return '@media'; }, [mutable]: '' };
        const obj = { a: ':hover' };
        const fromCall = (() => obj)();
        import * as tokens from './tokens';
        function f(param: string) {
          return { [param]: {} };
        }
        ({
          [mutable]: {},
          [call]: {},
          [missing]: {},
          [query]: {},
          [bp.lg]: {},
          [\`:\${mutable}\`]: {},
          [rest.md]: {},
          [rest.lg]: {},
          [fromCall.a]: {},
          [tokens]: {},
          [[':hover']]: {},
          [obj + ':hover']: {},
          [notDeclared]: {},
        });
      `),
    ).toEqual(Array(15).fill(null));
  });

  it('reads createStatic through the default import of the core package', () => {
    expect(
      resolveKeys(`
        import css from '@plumeria/core';
        const bp = css.createStatic({ md: '@media (width >= 768px)' });
        ({ [bp.md]: {} });
      `),
    ).toEqual(['@media (width >= 768px)']);
  });

  it('follows an import whose name is written as a string', () => {
    expect(
      resolveKeys(`
        import { 'query' as q } from './tokens';
        ({ [q]: {} });
      `),
    ).toEqual(['@media (width >= 640px)']);
  });

  it('reads a member of an object that is not a name', () => {
    expect(
      resolveKeys(`
        const obj = { inner: { a: ':hover' } };
        ({
          [({ a: ':focus' }).a]: {},
          [obj.inner.a]: {},
          [obj['inner']['a']]: {},
        });
      `),
    ).toEqual([':focus', ':hover', ':hover']);
  });

  it('reads a boolean literal and leaves other literals unresolved', () => {
    expect(
      resolveKeys(`
        ({
          [true]: {},
          [null]: {},
          [/x/]: {},
        });
      `),
    ).toEqual([true, null, null]);
  });

  it('leaves a member unresolved when its key is not a string', () => {
    expect(
      resolveKeys(`
        const obj = { a: ':hover', 1: ':focus' };
        ({
          [obj[1]]: {},
          [obj[notDeclared]]: {},
        });
      `),
    ).toEqual([null, null]);
  });

  it('leaves an expression unresolved when one side is', () => {
    expect(
      resolveKeys(`
        ({
          [1 + notDeclared]: {},
          [notDeclared * 2]: {},
        });
      `),
    ).toEqual([null, null]);
  });

  it('leaves a constant that names itself unresolved', () => {
    expect(
      resolveKeys(`
        const a = b;
        const b = a;
        ({ [a]: {} });
      `),
    ).toEqual([null]);
  });

  it('leaves a createStatic call without an argument unresolved', () => {
    expect(
      resolveKeys(`
        import * as css from '@plumeria/core';
        const empty = css.createStatic();
        ({ [empty.md]: {} });
      `),
    ).toEqual([null]);
  });
});
