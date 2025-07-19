import type { CreateValues, ReturnVariableType } from 'zss-engine';
import { camelToKebabCase } from 'zss-engine';
import { global } from './global';

const defineVars = <const T extends CreateValues>(object: T) => {
  const styles: Record<string, CreateValues> = {
    ':root': {},
  };

  const result = {} as ReturnVariableType<T>;

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    (result as any)[key] = `var(--${kebabKey})`;
    styles[':root'][`--${key}`] = value;
  });

  global(styles);
  return result;
};

export { defineVars };
