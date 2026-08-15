import type { Node, ObjectExpression } from 'estree';

type StyleValue = {
  type: string;
  body?: Node & { body?: Node[] };
  argument?: Node | null;
};

export function styleObjectFromValue(value: {
  type: string;
}): ObjectExpression | undefined {
  if (value.type === 'ObjectExpression') return value as ObjectExpression;
  if (
    value.type !== 'ArrowFunctionExpression' &&
    value.type !== 'FunctionExpression'
  )
    return undefined;

  const body = (value as StyleValue).body;
  if (body?.type === 'ObjectExpression') return body as ObjectExpression;
  if (body?.type !== 'BlockStatement') return undefined;

  const first = body.body?.[0] as StyleValue | undefined;
  return first?.type === 'ReturnStatement' &&
    first.argument?.type === 'ObjectExpression'
    ? (first.argument as ObjectExpression)
    : undefined;
}
