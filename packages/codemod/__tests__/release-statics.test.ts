import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { planRelease } from '../src/release';
import { releaseStyles } from '../src/transforms/release-styles';
import { resetTsconfigCache } from '../src/resolve';

const MEDIA = `import * as css from '@plumeria/core';

export const breakpoints = css.createStatic({
  lg: '@media (max-width: 1023.98px)',
});
`;

describe('createStatic values imported from another file', () => {
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
          'codemod/release-styles': [
            'error',
            {
              modules: plan.modules,
              themes: plan.themes,
              animations: plan.animations,
              statics: plan.statics,
            },
          ],
        },
      },
      file,
    ).output;

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'statics-')));
    cwd = process.cwd();
    process.chdir(dir);
    resetTsconfigCache();
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    resetTsconfigCache();
  });

  it('inlines an imported value used as a computed key', () => {
    const media = add('lib/mq.ts', MEDIA);
    add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport { breakpoints } from '../lib/mq';\nconst styles = css.create({\n  box: { color: 'red', [breakpoints.lg]: { color: 'blue' } },\n});\nexport const Card = () => <div classStyle={styles.box} />;\n`,
    );

    const plan = planRelease([dir]);
    expect(plan.statics[media]).toEqual(['breakpoints']);
    const sheet = plan.stylesheets.find((candidate) =>
      candidate.source.endsWith('Card.tsx'),
    )!;
    expect(sheet.reports).toEqual([]);
    expect(sheet.css).toContain('@media (max-width: 1023.98px)');
  });

  it('resolves the same value through a tsconfig paths alias', () => {
    add('tsconfig.json', JSON.stringify({ compilerOptions: { paths: {} } }));
    add('lib/mq.ts', MEDIA);
    add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport * as media from '../lib/mq';\nconst styles = css.create({\n  box: { [media.breakpoints.lg]: { color: 'blue' } },\n});\nexport const Card = () => <div classStyle={styles.box} />;\n`,
    );

    const sheet = planRelease([dir]).stylesheets.find((candidate) =>
      candidate.source.endsWith('Card.tsx'),
    )!;
    expect(sheet.reports).toEqual([]);
    expect(sheet.css).toContain('@media (max-width: 1023.98px)');
  });

  it('drops the import once the value only lived in the styles', () => {
    add('lib/mq.ts', MEDIA);
    const card = add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport { breakpoints } from '../lib/mq';\nconst styles = css.create({\n  box: { [breakpoints.lg]: { color: 'blue' } },\n});\nexport const Card = () => <div classStyle={styles.box} />;\n`,
    );

    const output = rewrite(card, planRelease([dir]));
    expect(output).not.toContain('breakpoints');
    expect(output).toContain("import styles from './Card.module.css';");
  });

  it('keeps the import when the value is also read outside the styles', () => {
    add('lib/mq.ts', MEDIA);
    const card = add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport { breakpoints } from '../lib/mq';\nconst styles = css.create({\n  box: { [breakpoints.lg]: { color: 'blue' } },\n});\nexport const Card = () => {\n  const wide = window.matchMedia(breakpoints.lg).matches;\n  return <div classStyle={styles.box}>{String(wide)}</div>;\n};\n`,
    );

    const output = rewrite(card, planRelease([dir]));
    expect(output).toContain("import { breakpoints } from '../lib/mq';");
    expect(output).toContain('window.matchMedia(breakpoints.lg)');
  });

  it('leaves the file that declares the values untouched', () => {
    const media = add('lib/mq.ts', MEDIA);
    add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport { breakpoints } from '../lib/mq';\nconst styles = css.create({\n  box: { [breakpoints.lg]: { color: 'blue' } },\n});\nexport const Card = () => <div classStyle={styles.box} />;\n`,
    );

    expect(rewrite(media, planRelease([dir]))).toBe(MEDIA);
  });

  it('follows a createStatic that builds on an imported one', () => {
    add('lib/mq.ts', MEDIA);
    const derived = add(
      'lib/derived.ts',
      `import * as css from '@plumeria/core';\nimport { breakpoints } from './mq';\nexport const wide = css.createStatic({ lg: breakpoints.lg });\n`,
    );
    add(
      'src/Card.tsx',
      `import * as css from '@plumeria/core';\nimport { wide } from '../lib/derived';\nconst styles = css.create({\n  box: { [wide.lg]: { color: 'blue' } },\n});\nexport const Card = () => <div classStyle={styles.box} />;\n`,
    );

    const plan = planRelease([dir]);
    expect(plan.statics[derived]).toEqual(['wide']);
    const sheet = plan.stylesheets.find((candidate) =>
      candidate.source.endsWith('Card.tsx'),
    )!;
    expect(sheet.reports).toEqual([]);
    expect(sheet.css).toContain('@media (max-width: 1023.98px)');
  });
});
