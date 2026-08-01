import { resolveComponentKey } from '../src/parser';

const ident = (value: string) => ({ type: 'Identifier', value });
const member = (object: unknown, property: unknown) => ({
  type: 'JSXMemberExpression',
  object,
  property,
});

const FILE = '/project/src/Home.tsx';

describe('resolveComponentKey', () => {
  test('resolves a capitalised identifier against its own file', () => {
    expect(resolveComponentKey(ident('Card'), FILE, {})).toBe(`${FILE}-Card`);
  });

  test('follows a local import to the declaring file', () => {
    expect(
      resolveComponentKey(ident('Card'), FILE, {
        Card: { actualPath: '/project/src/card.tsx', importedName: '*' },
      }),
    ).toBe('/project/src/card.tsx-Card');
  });

  test('ignores a lowercase identifier, which is a host element', () => {
    expect(resolveComponentKey(ident('div'), FILE, {})).toBeNull();
  });

  test('ignores a node that is neither an identifier nor a member chain', () => {
    expect(resolveComponentKey(undefined, FILE, {})).toBeNull();
    expect(
      resolveComponentKey({ type: 'JSXNamespacedName' }, FILE, {}),
    ).toBeNull();
  });

  test('resolves a member chain down to its leaf', () => {
    expect(
      resolveComponentKey(
        member(member(ident('Icons'), ident('Social')), ident('Logo')),
        FILE,
        {},
      ),
    ).toBe(`${FILE}-Logo`);
  });

  test('ignores a member chain whose property is not an identifier', () => {
    expect(
      resolveComponentKey(
        member(ident('Icons'), { type: 'JSXNamespacedName' }),
        FILE,
        {},
      ),
    ).toBeNull();
  });

  test('ignores a member chain that is not rooted at an identifier', () => {
    expect(
      resolveComponentKey(
        member({ type: 'JSXNamespacedName' }, ident('Logo')),
        FILE,
        {},
      ),
    ).toBeNull();
  });
});
