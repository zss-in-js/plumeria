import { genBase36Hash } from 'zss-engine';

export const varTypeHashOf = (
  name: string,
  rule: Record<string, unknown>,
): string => genBase36Hash({ _varTypeName: name, ...rule }, 1, 8);

export const createVarType = (rule: Record<string, unknown>, hash: string) => ({
  [`@property --pr-${hash}`]: {
    syntax: `"${typeof rule.syntax === 'string' ? rule.syntax : '*'}"`,
    inherits: rule.inherits === true ? 'true' : 'false',
    ...(rule.initialValue !== undefined && {
      initialValue: rule.initialValue,
    }),
  },
});
