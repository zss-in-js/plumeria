import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { planRelease } from '../src/release';
import { releaseStyles } from '../src/transforms/release-styles';
import { resetTsconfigCache } from '../src/resolve';

describe('several css.create calls in one file', () => {
  let dir: string;
  let cwd: string;

  const add = (name: string, content: string) => {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    return file;
  };

  const rewrite = (file: string, plan: ReturnType<typeof planRelease>) =>
    new Linter().verifyAndFix(
      fs.readFileSync(file, 'utf8'),
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tsParser as never,
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        plugins: { codemod: { rules: { 'release-styles': releaseStyles } } },
        rules: {
          'codemod/release-styles': ['error', { modules: plan.modules }],
        },
      },
      file,
    ).output;

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'multi-')));
    cwd = process.cwd();
    process.chdir(dir);
    resetTsconfigCache();
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    resetTsconfigCache();
  });

  it('writes every create into one stylesheet', () => {
    const source = add(
      'Button.tsx',
      `import * as css from '@plumeria/core';\nconst styles = css.create({ button: { color: 'red' } });\nconst sizeStyles = css.create({ medium: { padding: 8 } });\nexport const Button = () => (\n  <a classStyle={[styles.button, sizeStyles.medium]} />\n);\n`,
    );

    const plan = planRelease([dir]);
    const sheet = plan.stylesheets[0];
    expect(sheet.reports).toEqual([]);
    expect(sheet.css).toContain('.button {\n  color: red;\n}');
    expect(sheet.css).toContain('.medium {\n  padding: 8px;\n}');
    expect(plan.modules[source].aliases).toEqual({
      sizeStyles: { medium: 'medium' },
    });
  });

  it('reads the second binding from the shared module', () => {
    const source = add(
      'Button.tsx',
      `import * as css from '@plumeria/core';\nconst styles = css.create({ button: { color: 'red' } });\nconst sizeStyles = css.create({ medium: { padding: 8 } });\nexport const Button = () => (\n  <a classStyle={[styles.button, sizeStyles.medium]} />\n);\n`,
    );

    const output = rewrite(source, planRelease([dir]));
    expect(output).toContain("import styles from './Button.module.css';");
    expect(output).not.toContain('sizeStyles');
    expect(output).toContain('className={styles.buttonMedium}');
  });

  it('renames a key the earlier create already claimed', () => {
    const source = add(
      'Button.tsx',
      `import * as css from '@plumeria/core';\nconst styles = css.create({ base: { color: 'red' } });\nconst hoverStyles = css.create({ base: { color: 'blue' } });\nexport const Button = () => (\n  <a classStyle={[styles.base, hoverStyles.base]} />\n);\n`,
    );

    const plan = planRelease([dir]);
    expect(plan.stylesheets[0].css).toContain('.base {\n  color: red;\n}');
    expect(plan.stylesheets[0].css).toContain(
      '.hoverStyles-base {\n  color: blue;\n}',
    );
    expect(plan.modules[source].aliases).toEqual({
      hoverStyles: { base: 'hoverStyles-base' },
    });

    const output = rewrite(source, plan);
    expect(output).toContain('className={styles.baseHoverStylesBase}');
  });

  it('keeps a function style declared by the second create', () => {
    const source = add(
      'Button.tsx',
      `import * as css from '@plumeria/core';\nconst styles = css.create({ button: { color: 'red' } });\nconst sizeStyles = css.create({ size: (width) => ({ width }) });\nexport const Button = ({ width }) => (\n  <a classStyle={sizeStyles.size(width)} />\n);\n`,
    );

    const plan = planRelease([dir]);
    expect(plan.stylesheets[0].reports).toEqual([]);
    expect(plan.modules[source].functions).toEqual({
      size: { params: ['width'], variables: ['--size-styles-size-width'] },
    });

    const output = rewrite(source, plan);
    expect(output).toContain('className={styles.size}');
    expect(output).toContain(
      "style={{ ['--size-styles-size-width' as string]: width }}",
    );
  });

  it('treats the file as definition-only when no create is used locally', () => {
    const source = add(
      'styles.ts',
      `import * as css from '@plumeria/core';\nexport const styles = css.create({ button: { color: 'red' } });\nexport const sizeStyles = css.create({ medium: { padding: 8 } });\n`,
    );

    expect(planRelease([dir]).modules[source].definitionOnly).toBe(true);
  });
});
