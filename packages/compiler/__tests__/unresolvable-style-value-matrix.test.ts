import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );
  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  const run = (body: string) =>
    transformSource({
      source: `import * as css from '@plumeria/core';\n${body}`,
      moduleId: `${DIR}/fixture.tsx`,
      filePath: `${DIR}/fixture.tsx`,
      root: DIR,
      cwd: DIR,
      styleProp: DEFAULT_STYLE_PROP,
      propertyPolicy: undefined,
      isDev: false,
      collectOndemandSheets: true,
      addDependency: () => {},
    });

  const UNRESOLVABLE = /Cannot resolve the value of/;

  // Where the value that cannot be resolved is written. Each returns the
  // declarations it needs and the property list that carries it.
  const ORIGINS = {
    'at the call site': { decl: '', carried: `letterSpacing: read(),` },
    'behind a local const': {
      decl: `const SIZE = read();`,
      carried: `letterSpacing: SIZE,`,
    },
    'inside a const that is spread in': {
      decl: `const tokens = { letterSpacing: read() };`,
      carried: `...tokens,`,
    },
  };

  // A style function is how a runtime value is passed, so its body is checked
  // the same way rather than skipped: the parameter is legitimate, a call sitting
  // beside it is not.
  const FUNCTION_PLACES = {
    'in the object a style function returns': (props: string) =>
      `(w: string) => ({ width: w, ${props} })`,
    'under a selector inside a style function': (props: string) =>
      `(w: string) => ({ width: w, ':hover': { ${props} } })`,
  };

  // What comes after it in the same object. A later property or a later spread
  // that writes the same key replaces it, so the value never reaches the CSS and
  // rejecting it would be wrong.
  const FOLLOWERS = {
    'nothing that writes it': {
      decl: '',
      after: `color: 'red',`,
      rejects: true,
    },
    'a property writing the same key': {
      decl: '',
      after: `letterSpacing: '1px',`,
      rejects: false,
    },
    'a spread writing the same key': {
      decl: `const override = { letterSpacing: '1px' };`,
      after: `...override,`,
      rejects: false,
    },
  };

  // Where in the style the whole thing sits.
  const PLACES = {
    'at the top of a style': (props: string) => `{ ${props} }`,
    'under a selector': (props: string) => `{ ':hover': { ${props} } }`,
    'under an at-rule': (props: string) => `{ '@media screen': { ${props} } }`,
  };

  describe('a value is rejected exactly when the style still uses it', () => {
    for (const [origin, o] of Object.entries(ORIGINS)) {
      for (const [follower, f] of Object.entries(FOLLOWERS)) {
        for (const [place, wrap] of Object.entries(FUNCTION_PLACES)) {
          if (origin === 'inside a const that is spread in') continue;
          const body = `${o.decl}\n${f.decl}\nconst styles = css.create({ box: ${wrap(`${o.carried} ${f.after}`)} });`;
          const label = `${origin}, followed by ${follower}, ${place}`;

          if (f.rejects) {
            it(`rejects it ${label}`, async () => {
              await expect(run(body)).rejects.toThrow(UNRESOLVABLE);
            });
          } else {
            it(`accepts it ${label}`, async () => {
              await expect(run(body)).resolves.toBeDefined();
            });
          }
        }
      }
    }

    for (const [origin, o] of Object.entries(ORIGINS)) {
      for (const [follower, f] of Object.entries(FOLLOWERS)) {
        for (const [place, wrap] of Object.entries(PLACES)) {
          const body = `${o.decl}\n${f.decl}\nconst styles = css.create({ box: ${wrap(`${o.carried} ${f.after}`)} });`;
          const label = `${origin}, followed by ${follower}, ${place}`;

          if (f.rejects) {
            it(`rejects it ${label}`, async () => {
              await expect(run(body)).rejects.toThrow(UNRESOLVABLE);
            });
          } else {
            it(`accepts it ${label}`, async () => {
              await expect(run(body)).resolves.toBeDefined();
            });
          }
        }
      }
    }
  });
});
