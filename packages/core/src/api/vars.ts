import type { CreateValues, ReturnVariableType } from 'zss-engine';
import { camelToKebabCase } from 'zss-engine';
import { getCurrentlyExecutingFile } from '../checker/state';
import { recordVarDefinition } from '../checker/duplication-checker';
import { global } from './global';

const defineVars = <const T extends CreateValues>(object: T) => {
  const styles: Record<string, CreateValues> = {
    ':root': {},
  };

  const result = {} as ReturnVariableType<T>;

  const filePath = getCurrentlyExecutingFile();

  Object.keys(object).forEach((key) => {
    if (filePath) {
      recordVarDefinition(key, filePath);
    }
  });

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    (result as any)[key] = `var(--${kebabKey})`;
    styles[':root'][`--${key}`] = value;
  });

  global(styles);
  return result;
};

export { defineVars };
