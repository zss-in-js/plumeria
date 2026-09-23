import { jsxDEV as baseJsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { withClassName } from './class-style';

type Props = Record<string, unknown> | null;

export const jsxDEV = (type: unknown, props: Props, ...rest: unknown[]) =>
  (baseJsxDEV as (t: unknown, p: Props, ...r: unknown[]) => unknown)(type, withClassName(props), ...rest);

export { Fragment };
