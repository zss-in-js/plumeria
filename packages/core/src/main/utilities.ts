import type { Join } from 'zss-engine';
import type { CSSProperties, RxVariableSet } from 'zss-engine';
import { props } from './props';

const px = <T extends readonly string[]>(...pseudos: T): Join<T> => {
  return pseudos.filter(Boolean).join('') as Join<T>;
};

const rx = (cssProperties: Readonly<CSSProperties>, varSet: RxVariableSet) => ({
  className: props(cssProperties),
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});

export { px, rx };
