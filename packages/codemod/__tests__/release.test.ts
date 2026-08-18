import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  formatReleaseReports,
  planRelease,
  releasedPath,
  writeRelease,
} from '../src/release';

describe('Plumeria release planning', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-release-'));
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('plans and writes a CSS Module beside its source', () => {
    const source = path.join(dir, 'Card.tsx');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';\nexport const styles = css.create({ card: { padding: 8 } });`,
    );

    const plan = planRelease([dir]);
    expect(plan.stylesheets).toHaveLength(1);
    expect(plan.modules[source]).toEqual({
      source: './Card.module.css',
      target: releasedPath(source),
      binding: 'styles',
      definitionOnly: true,
    });
    writeRelease(plan);
    expect(fs.readFileSync(releasedPath(source), 'utf8')).toContain(
      'padding: 8px',
    );
  });

  it('drops the .styles segment when naming the CSS Module', () => {
    expect(releasedPath('/app/Card.styles.ts')).toBe('/app/Card.module.css');
    expect(releasedPath('/app/Card.tsx')).toBe('/app/Card.module.css');
    expect(releasedPath('/app/Card.theme.ts')).toBe(
      '/app/Card.theme.module.css',
    );
  });

  it('marks a file that uses its own styles as more than a definition', () => {
    const source = path.join(dir, 'Inline.tsx');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';\nconst styles = css.create({ box: { color: 'red' } });\nexport const Box = () => <div classStyle={styles.box} />;`,
    );

    expect(planRelease([dir]).modules[source]).not.toHaveProperty(
      'definitionOnly',
    );
  });

  it('does not overwrite an existing CSS Module', () => {
    const source = path.join(dir, 'Card.ts');
    const target = releasedPath(source);
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';\nconst styles = css.create({ card: { color: 'red' } });`,
    );
    fs.writeFileSync(target, '.old {}');

    const plan = planRelease([dir]);
    expect(plan.stylesheets[0].reports[0].kind).toBe('target-exists');
    expect(formatReleaseReports(plan.stylesheets, dir)[0]).toBe('Card.ts');
    writeRelease(plan);
    expect(fs.readFileSync(target, 'utf8')).toBe('.old {}');
  });

  it('appends createTheme output to src/styles/global.css', () => {
    const sourceDir = path.join(dir, 'src');
    const stylesDir = path.join(sourceDir, 'styles');
    fs.mkdirSync(stylesDir, { recursive: true });
    const source = path.join(sourceDir, 'theme.ts');
    const global = path.join(stylesDir, 'global.css');
    fs.writeFileSync(global, '@layer reset;\n');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
const theme = css.createTheme('.dark', {
  text: { default: 'black', theme: 'white' },
});
export const styles = css.create({ card: { color: theme.text } });`,
    );

    const plan = planRelease([dir]);
    expect(plan.global?.target).toBe(global);
    writeRelease(plan);
    expect(fs.readFileSync(global, 'utf8')).toContain('@layer reset;');
    expect(fs.readFileSync(global, 'utf8')).toContain('.dark');
    expect(fs.readFileSync(global, 'utf8')).toContain(
      'Generated from css.createTheme',
    );
  });

  it('resolves a createTheme imported from another file', () => {
    const sourceDir = path.join(dir, 'src');
    fs.mkdirSync(sourceDir);
    const themeSource = path.join(sourceDir, 'theme.ts');
    const cardSource = path.join(sourceDir, 'Card.tsx');
    fs.writeFileSync(
      themeSource,
      `import * as css from '@plumeria/core';
export const theme = css.createTheme('.dark', {
  text: { default: 'black', theme: 'white' },
});`,
    );
    fs.writeFileSync(
      cardSource,
      `import * as css from '@plumeria/core';
import { theme } from './theme';
export const styles = css.create({ card: { color: theme.text } });`,
    );

    const plan = planRelease([dir]);
    expect(plan.themes[themeSource]).toEqual(['theme']);
    expect(plan.stylesheets).toHaveLength(1);
    expect(plan.stylesheets[0].css).toMatch(/color: var\(--.+-text\);/);
    expect(plan.stylesheets[0].reports).toEqual([]);
    expect(plan.global?.css).toContain('.dark');
  });

  it('resolves imported keyframes in viewTransition and css.create', () => {
    const sourceDir = path.join(dir, 'src');
    fs.mkdirSync(sourceDir);
    const animationSource = path.join(sourceDir, 'animation.ts');
    const cardSource = path.join(sourceDir, 'Card.tsx');
    fs.writeFileSync(
      animationSource,
      `import * as css from '@plumeria/core';
export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
export const crossFade = css.viewTransition({ old: { animationName: fade } });`,
    );
    fs.writeFileSync(
      cardSource,
      `import * as css from '@plumeria/core';
import { fade, crossFade } from './animation';
export const styles = css.create({ card: {
  animationName: fade,
  viewTransitionName: crossFade,
} });`,
    );

    const plan = planRelease([dir]);
    expect(plan.animations[animationSource]).toEqual(['fade', 'crossFade']);
    expect(plan.stylesheets[0].css).toMatch(/animation-name: kf-[a-z\d]+;/);
    expect(plan.stylesheets[0].css).toMatch(
      /view-transition-name: vt-[a-z\d]+;/,
    );
    expect(plan.global?.css).toMatch(/@keyframes kf-[a-z\d]+/);
    expect(plan.global?.css).toMatch(/::view-transition-old\(vt-[a-z\d]+\)/);
  });

  it('resolves namespace imports and appends after a file without a newline', () => {
    const sourceDir = path.join(dir, 'src');
    const stylesDir = path.join(sourceDir, 'styles');
    fs.mkdirSync(stylesDir, { recursive: true });
    const definitions = path.join(sourceDir, 'definitions.ts');
    const card = path.join(sourceDir, 'Card.tsx');
    const global = path.join(stylesDir, 'global.css');
    fs.writeFileSync(global, '@layer reset;');
    fs.writeFileSync(
      definitions,
      `import * as css from '@plumeria/core';
export const theme = css.createTheme('.dark', { color: { default: 'black', theme: 'white' } });
export const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });`,
    );
    fs.writeFileSync(
      card,
      `import * as css from '@plumeria/core';
import * as definitions from './definitions';
export const styles = css.create({ card: {
  color: definitions.theme.color,
  animationName: definitions.fade,
} });`,
    );

    const plan = planRelease([dir]);
    expect(plan.stylesheets[0].reports).toEqual([]);
    expect(plan.stylesheets[0].css).toMatch(/color: var\(--.+\);/);
    expect(plan.stylesheets[0].css).toMatch(/animation-name: kf-[a-z\d]+;/);
    writeRelease(plan);
    expect(fs.readFileSync(global, 'utf8')).toContain('@layer reset;\n\n/*');
  });

  it('skips source files that cannot be parsed', () => {
    fs.writeFileSync(path.join(dir, 'broken.ts'), 'const = ;');
    fs.writeFileSync(
      path.join(dir, 'valid.ts'),
      `import * as css from '@plumeria/core';
const styles = css.create({ card: { color: 'red' } });`,
    );

    expect(planRelease([dir]).stylesheets).toHaveLength(1);
  });

  it('accepts a file target and ignores missing and generated directories', () => {
    const source = path.join(dir, 'Card.ts');
    const ignoredDir = path.join(dir, 'node_modules');
    fs.mkdirSync(ignoredDir);
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
const styles = css.create({ card: { color: 'red' } });`,
    );
    fs.writeFileSync(
      path.join(ignoredDir, 'Ignored.ts'),
      `const styles = css.create({ ignored: { color: 'red' } });`,
    );
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');

    const plan = planRelease([
      source,
      path.join(dir, 'missing'),
      path.join(dir, 'package.json'),
    ]);
    expect(plan.stylesheets.map((sheet) => sheet.source)).toEqual([source]);
    expect(plan.global).toBeUndefined();
    expect(formatReleaseReports(plan.stylesheets, dir)).toEqual([]);
  });

  it('uses styles/global.css when the target is a file outside src', () => {
    const source = path.join(dir, 'theme.ts');
    const stylesDir = path.join(dir, 'styles');
    fs.mkdirSync(stylesDir);
    const global = path.join(stylesDir, 'global.css');
    fs.writeFileSync(global, '');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
export const theme = css.createTheme('.dark', {
  color: { default: 'black', theme: 'white' },
});`,
    );

    const plan = planRelease([source]);
    expect(plan.global?.target).toBe(global);
    writeRelease(plan);
    expect(fs.readFileSync(global, 'utf8')).toContain('createTheme');
  });

  it('records function metadata in a releasable module', () => {
    const source = path.join(dir, 'dynamic.tsx');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
export const styles = css.create({ size: (width) => ({ width }) });`,
    );

    expect(planRelease([dir]).modules[source].functions).toEqual({
      size: {
        params: ['width'],
        variables: ['--styles-size-width'],
        lengths: [true],
      },
    });
  });

  it('creates styles/global.css when neither src nor a stylesheet exists', () => {
    const source = path.join(dir, 'theme.ts');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
const theme = css.createTheme('.dark', {
  color: { default: 'black', theme: 'white' },
});`,
    );

    const plan = planRelease([source]);
    expect(plan.global?.target).toBe(path.join(dir, 'styles', 'global.css'));
    writeRelease(plan);
    expect(fs.existsSync(path.join(dir, 'styles', 'global.css'))).toBe(true);
  });

  it('does not descend into ignored directories', () => {
    const ignored = path.join(dir, 'node_modules');
    fs.mkdirSync(ignored);
    fs.writeFileSync(
      path.join(ignored, 'styles.ts'),
      `const styles = css.create({ card: { color: 'red' } });`,
    );

    expect(planRelease([dir]).stylesheets).toEqual([]);
  });

  it('handles string-named, missing, and default imported bindings', () => {
    const definitions = path.join(dir, 'definitions.ts');
    const card = path.join(dir, 'Card.ts');
    fs.writeFileSync(
      definitions,
      `import * as css from '@plumeria/core';
export const theme = css.createTheme('.dark', {
  color: { default: 'black', theme: 'white' },
});`,
    );
    fs.writeFileSync(
      card,
      `import fallback, { 'theme' as theme, missing } from './definitions';
import * as css from '@plumeria/core';
const styles = css.create({ card: { color: theme.color } });`,
    );

    expect(planRelease([dir]).stylesheets[0].reports).toEqual([]);
  });

  it('formats an absolute source when it equals the reporting cwd', () => {
    const source = path.join(dir, 'Card.ts');
    fs.writeFileSync(
      source,
      `import * as css from '@plumeria/core';
const styles = css.create({ card: { color: getColor() } });`,
    );
    const plan = planRelease([source]);

    expect(formatReleaseReports(plan.stylesheets, source)[0]).toBe(source);
  });
});
