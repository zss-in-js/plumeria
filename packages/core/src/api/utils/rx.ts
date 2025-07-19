import type { CSSProperties, RxVariableSet } from 'zss-engine';
import { props } from '../../api/props';

const rx = (
  styleProps: string | Readonly<CSSProperties>,
  varSet: RxVariableSet,
) => {
  const className =
    typeof styleProps === 'string' ? styleProps : props(styleProps);

  return {
    className,
    style: Object.fromEntries(
      Object.entries(varSet).map(([key, value]) => [key, value]),
    ),
  };
};

export { rx };
