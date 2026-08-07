import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter } from 'eslint';
import { plan, write } from '../src/migrate';
import { adoptStyles } from '../src/transforms/adopt-styles';

// The migrated files live in an example app, so `pnpm build:examples` builds
// them on every CI run — that is what says they compile and emit CSS. This test
// regenerates both of them from the stylesheet and asserts they come out byte
// for byte the same, which carries that build guarantee onto the codemod's own
// output. Golden-testing only the stylesheet would leave the consumer rewrite
// unexercised: the committed file would keep passing while the rule broke.
const FIXTURE = path.resolve(
  __dirname,
  '../../../examples/example-vite-react/src/migrate-e2e',
);

// The consumer as it read before the migration. Kept here rather than in the
// example, where an unmigrated file would be built along with the rest.
const CONSUMER = `import s from './Card.module.css';

export const Card = () => (
  <div className={s.card}>
    <span className={s.badge}>b</span>
    <span className={s['card-title']}>t</span>
  </div>
);
`;

const read = (dir: string, name: string) =>
  fs.readFileSync(path.join(dir, name), 'utf-8');

describe('css-modules migration, end to end', () => {
  let dir: string;
  let rewritten: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-e2e-'));
    fs.copyFileSync(
      path.join(FIXTURE, 'Card.module.css'),
      path.join(dir, 'Card.module.css'),
    );

    const { modules } = plan([dir]);
    write([dir]);

    const linter = new Linter();
    const result = linter.verifyAndFix(
      CONSUMER,
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
        },
        plugins: { codemod: { rules: { 'adopt-styles': adoptStyles } } },
        rules: { 'codemod/adopt-styles': ['error', { modules }] },
      },
      'Card.tsx',
    );
    rewritten = result.output;
  });

  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('writes the module the example was built from', () => {
    expect(read(dir, 'Card.styles.ts')).toBe(read(FIXTURE, 'Card.styles.ts'));
  });

  it('rewrites the consumer the example was built from', () => {
    expect(rewritten).toBe(read(FIXTURE, 'Card.tsx'));
  });

  it('converts every rule the stylesheet holds', () => {
    expect(plan([dir]).stylesheets[0].reports).toEqual([]);
  });
});
