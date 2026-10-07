import * as path from 'path';
import { type LintOverrides, lintOverrides } from './guard';

const STYLE_PROP_FLAG = '--style-prop';
const PROBED_FILES = ['src/index.tsx', 'app/page.tsx', 'index.tsx', 'index.js'];

interface ESLintInstance {
  calculateConfigForFile(file: string): Promise<unknown>;
}

interface ESLintModule {
  ESLint: new (options: { cwd: string }) => ESLintInstance;
  loadESLint?: (options: {
    useFlatConfig: boolean;
  }) => Promise<ESLintModule['ESLint']>;
}

export function takeStyleProp(args: string[]): {
  styleProp?: string;
  rest: string[];
} {
  const rest: string[] = [];
  let styleProp: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === STYLE_PROP_FLAG) {
      styleProp = args[++i];
      if (!styleProp) throw new Error(`${STYLE_PROP_FLAG} needs a prop name`);
    } else if (arg.startsWith(`${STYLE_PROP_FLAG}=`)) {
      styleProp = arg.slice(STYLE_PROP_FLAG.length + 1);
      if (!styleProp) throw new Error(`${STYLE_PROP_FLAG} needs a prop name`);
    } else {
      rest.push(arg);
    }
  }
  return { styleProp, rest };
}

export async function stylePropFromESLint(
  cwd: string,
): Promise<string | undefined> {
  let eslint: ESLintModule;
  try {
    eslint = require(require.resolve('eslint', { paths: [cwd] }));
  } catch {
    return undefined;
  }
  try {
    const ESLint = eslint.loadESLint
      ? await eslint.loadESLint({ useFlatConfig: true })
      : eslint.ESLint;
    const instance = new ESLint({ cwd });
    for (const file of PROBED_FILES) {
      const config = (await instance.calculateConfigForFile(
        path.join(cwd, file),
      )) as { settings?: { plumeria?: { styleProp?: unknown } } } | undefined;
      const styleProp = config?.settings?.plumeria?.styleProp;
      if (typeof styleProp === 'string') return styleProp;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export async function cliOverrides(
  args: string[],
  cwd: string,
): Promise<{ overrides: LintOverrides; rest: string[] }> {
  const { styleProp, rest } = takeStyleProp(args);
  return {
    overrides: lintOverrides({
      styleProp: styleProp ?? (await stylePropFromESLint(cwd)),
    }),
    rest,
  };
}
