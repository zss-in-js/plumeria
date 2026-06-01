import { camelToKebabCase, genBase36Hash, isAtRule } from 'zss-engine';
import type { CreateTheme } from './types';

const createTheme = <const T extends CreateTheme>(
  themeSelector: string,
  rule: T,
) => {
  const rootTarget: Record<string, string | number> = {};
  const themeTarget: Record<string, string | number> = {};

  for (const key in rule) {
    const valueObj = rule[key];
    const hash = genBase36Hash({ [key]: valueObj }, 1, 8);
    const cssVarName = `--${hash}-${camelToKebabCase(key)}`;
    rootTarget[cssVarName] = valueObj.default;
    themeTarget[cssVarName] = valueObj.theme;
  }

  if (isAtRule(themeSelector)) {
    return {
      ':where(:root)': {
        ...rootTarget,
        [themeSelector]: themeTarget,
      },
    };
  }

  const formattedSelector =
    themeSelector.startsWith('@') ||
    themeSelector.startsWith('.') ||
    themeSelector.startsWith('#') ||
    themeSelector.startsWith(':') ||
    themeSelector.startsWith('[')
      ? themeSelector
      : '.' + themeSelector;

  return {
    ':where(:root)': rootTarget,
    [formattedSelector]: themeTarget,
  };
};

export { createTheme };
