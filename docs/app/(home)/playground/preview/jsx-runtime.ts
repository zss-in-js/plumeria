import { jsx as baseJsx, jsxs as baseJsxs, Fragment } from 'react/jsx-runtime';
import { withClassName } from './class-style';

type Props = Record<string, unknown> | null;

export const jsx = (type: unknown, props: Props, key?: unknown) =>
  (baseJsx as (t: unknown, p: Props, k?: unknown) => unknown)(type, withClassName(props), key);

export const jsxs = (type: unknown, props: Props, key?: unknown) =>
  (baseJsxs as (t: unknown, p: Props, k?: unknown) => unknown)(type, withClassName(props), key);

export { Fragment };
