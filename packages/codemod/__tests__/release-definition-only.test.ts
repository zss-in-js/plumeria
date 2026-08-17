import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { planRelease } from '../src/release';
import { releaseStyles } from '../src/transforms/release-styles';
import { resetTsconfigCache } from '../src/resolve';

const STYLES = `import { css } from '@plumeria/core';

export const styles = css.create({
  card: { color: 'red' },
});
`;

describe('a styles file kept out of the rewrite', () => {
  let dir: string;
  let cwd: string;

  const add = (name: string, content: string) => {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    return file;
  };

  const rewrite = (file: string, modules: Record<string, any>) => {
    const linter = new Linter();
    return linter.verifyAndFix(
      fs.readFileSync(file, 'utf8'),
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          parser: tsParser as never,
          parserOptions: {
            ecmaFeatures: { jsx: true },
            sourceType: 'module',
          },
        },
        plugins: { codemod: { rules: { 'release-styles': releaseStyles } } },
        rules: { 'codemod/release-styles': ['error', { modules }] },
      },
      file,
    ).output;
  };

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kept-')));
    cwd = process.cwd();
    process.chdir(dir);
    resetTsconfigCache();
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    resetTsconfigCache();
  });

  it('names the module without the .styles segment', () => {
    const source = add('src/Card.styles.ts', STYLES);
    add('src/Card.tsx', '');
    expect(planRelease([dir]).modules[source].target).toBe(
      path.join(dir, 'src', 'Card.module.css'),
    );
  });

  it('leaves the definition file exactly as it was', () => {
    const source = add('src/Card.styles.ts', STYLES);
    const { modules } = planRelease([dir]);
    expect(modules[source].definitionOnly).toBe(true);
    expect(rewrite(source, modules)).toBe(STYLES);
  });

  it('points the consumer at the CSS Module instead', () => {
    add('src/Card.styles.ts', STYLES);
    const consumer = add(
      'src/Card.tsx',
      `import { styles } from './Card.styles';\n\nexport const Card = () => <div classStyle={styles.card} />;\n`,
    );
    const { modules } = planRelease([dir]);
    expect(rewrite(consumer, modules)).toBe(
      `import styles from './Card.module.css';\n\nexport const Card = () => <div className={styles.card} />;\n`,
    );
  });

  it('walks back up to a consumer in another directory', () => {
    add('src/Card.styles.ts', STYLES);
    const consumer = add(
      'src/ui/Deep.tsx',
      `import { styles as cardStyles } from '../Card.styles';\n\nexport const Deep = () => <div classStyle={cardStyles.card} />;\n`,
    );
    const { modules } = planRelease([dir]);
    expect(rewrite(consumer, modules)).toBe(
      `import cardStyles from '../Card.module.css';\n\nexport const Deep = () => <div className={cardStyles.card} />;\n`,
    );
  });

  it('keeps the other bindings the consumer imported', () => {
    add('src/Card.styles.ts', `${STYLES}\nexport const label = 'card';\n`);
    const consumer = add(
      'src/Card.tsx',
      `import { styles, label } from './Card.styles';\n\nexport const Card = () => <div classStyle={styles.card}>{label}</div>;\n`,
    );
    const { modules } = planRelease([dir]);
    expect(rewrite(consumer, modules)).toBe(
      `import styles from './Card.module.css';\nimport { label } from './Card.styles';\n\nexport const Card = () => <div className={styles.card}>{label}</div>;\n`,
    );
  });

  it('still rewrites a file that defines and uses its own styles', () => {
    const inline = add(
      'src/Inline.tsx',
      `import { css } from '@plumeria/core';\n\nconst styles = css.create({\n  box: { color: 'blue' },\n});\n\nexport const Inline = () => <div classStyle={styles.box} />;\n`,
    );
    const { modules } = planRelease([dir]);
    expect(modules[inline].definitionOnly).toBeUndefined();
    expect(rewrite(inline, modules)).toBe(
      `\n\nimport styles from './Inline.module.css';\n\nexport const Inline = () => <div className={styles.box} />;\n`,
    );
  });
});
