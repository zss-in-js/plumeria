import * as parser from '@typescript-eslint/parser';
import type { CallExpression, ExpressionStatement } from 'estree';
import { styleObjectFromValue } from '../../src/util/styleObject';

const functionValue = (source: string) => {
  const ast = parser.parse(`fn(${source})`, { ecmaVersion: 'latest' });
  const statement = ast.body[0] as ExpressionStatement;
  return (statement.expression as CallExpression).arguments[0] as never;
};

describe('styleObjectFromValue', () => {
  it('returns an object expression directly', () => {
    expect(styleObjectFromValue(functionValue(`{ color: 'red' }`))?.type).toBe(
      'ObjectExpression',
    );
  });

  it('returns an arrow function object body', () => {
    expect(
      styleObjectFromValue(functionValue(`value => ({ color: value })`))?.type,
    ).toBe('ObjectExpression');
  });

  it('returns a block function first return object', () => {
    expect(
      styleObjectFromValue(
        functionValue(`function (value) { return { color: value }; }`),
      )?.type,
    ).toBe('ObjectExpression');
  });

  it('ignores unsupported function bodies', () => {
    expect(
      styleObjectFromValue(functionValue(`value => value`)),
    ).toBeUndefined();
    expect(
      styleObjectFromValue(
        functionValue(`function () { sideEffect(); return { color: 'red' }; }`),
      ),
    ).toBeUndefined();
  });
});
