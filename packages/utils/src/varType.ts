import { transform } from 'lightningcss';
import { genBase36Hash, transpile } from 'zss-engine';

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

export const checkedVarTypeHash = (
  name: string,
  rule: Record<string, unknown>,
): string => {
  const hash = varTypeHashOf(name, rule);
  const { styleSheet } = transpile(
    createVarType(rule, hash) as never,
    undefined,
    '--global',
  );
  try {
    transform({ filename: 'global.css', code: Buffer.from(styleSheet) });
    return hash;
  } catch {
    const syntax =
      typeof rule.syntax === 'string' ? `syntax "${rule.syntax}"` : 'no syntax';
    const initial =
      typeof rule.initialValue === 'string'
        ? `initialValue "${rule.initialValue}"`
        : typeof rule.initialValue === 'number'
          ? `initialValue ${rule.initialValue}`
          : 'no initialValue';
    throw new Error(
      `[plumeria] css.varType "${name}" is not a valid @property: ${syntax} with ${initial}. The syntax has to be a valid @property syntax, and the initial value has to match it.`,
    );
  }
};
