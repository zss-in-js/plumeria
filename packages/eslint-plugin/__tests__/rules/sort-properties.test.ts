import { RuleTester } from 'eslint';
import { sortProperties } from '../../src/rules/sort-properties';

const ruleTester = new RuleTester();

ruleTester.run('sort-properties', sortProperties, {
  valid: [
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { ...x, b: 1, a: 2 } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { z: 1, a: 2 } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import * as css from '@plumeria/core'; const styles = css.create({ key1: { position: 'absolute', color: 'red'} });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { ":hover": { color: \'blue\'}, "&": { color: \'red\'} } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { display: "block", ":hover": { color: "red" } } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import { create } from '@plumeria/core'; const styles = create({ key1: { position: 'absolute', color: 'red'} });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import { keyframes } from '@plumeria/core'; const anim = keyframes({ key1: { position: 'absolute', color: 'red'} });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import { viewTransition } from '@plumeria/core'; const vt = viewTransition({ key1: { position: 'absolute', color: 'red'} });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import plumeria from '@plumeria/core'; const styles = plumeria.create({ key1: { position: 'absolute', color: 'red'} });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    // Without @plumeria/core import, should NOT trigger
    {
      code: 'const styles = { key1: { display: "block", position: "absolute" } };',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Empty object (LIS check)
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: {} });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Spread at start
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { ...s, position: "absolute" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Non-Plumeria import
      code: 'import * as other from "other"; other.create({ main: { color: "red" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // String literal import
      code: 'import { "create" as c } from "@plumeria/core"; c({ main: { color: "red" } });',
      settings: {
        ecmaVersion: 'latest',
      },
    },
    {
      // Non-Identifier object in MemberExpression
      code: 'import * as css from "@plumeria/core"; (function(){ return css; })().create({ main: { color: "red" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Computed member access for create
      code: 'import * as css from "@plumeria/core"; css["create"]({ main: { color: "red" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Non-plumeria function call
      code: 'import { create } from "@plumeria/core"; someOtherFunction();',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Top-level spread in create
      code: 'import { create } from "@plumeria/core"; create({ ...spread, main: { color: "red" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Non-object argument in create
      code: 'import { create } from "@plumeria/core"; create(arg);',
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
  invalid: [
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { display: "block", position: "absolute", top: "0", right: "0", bottom: "0", left: "0" } });',
      errors: 1,
      output:
        'import * as css from "@plumeria/core"; const styles = css.create({ key1: { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: {\n  left: 0,\n  position: "absolute"\n} });',
      errors: 1,
      output:
        'import * as css from "@plumeria/core"; const styles = css.create({ key1: {\n  position: "absolute",\n  left: 0\n} });',
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import * as css from '@plumeria/core'; const styles = css.create({ key1: { '@media (min-width: 1024px)': { color: 'purple' }, '&:hover': { color: 'red' }, '&': { color: 'blue' } } });",
      errors: 1,
      output:
        "import * as css from '@plumeria/core'; const styles = css.create({ key1: { '&:hover': { color: 'red' }, '&': { color: 'blue' }, '@media (min-width: 1024px)': { color: 'purple' } } });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import * as css from '@plumeria/core'; const key = 'z'; const styles = css.create({ key1: { [key]: 'value', display: 'block' } });",
      errors: 1,
      output:
        "import * as css from '@plumeria/core'; const key = 'z'; const styles = css.create({ key1: { display: 'block', [key]: 'value' } });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import * as css from '@plumeria/core'; const styles = css.create({ key1: { '@container (min-width: 1024px)': { color: 'purple' }, '&:hover': { color: 'red' } } });",
      errors: 1,
      output:
        "import * as css from '@plumeria/core'; const styles = css.create({ key1: { '&:hover': { color: 'red' }, '@container (min-width: 1024px)': { color: 'purple' } } });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: "import * as css from '@plumeria/core'; const styles = css.create({ key1: { [`z-prop`]: 'value', display: 'block' } });",
      errors: 1,
      output:
        "import * as css from '@plumeria/core'; const styles = css.create({ key1: { display: 'block', [`z-prop`]: 'value' } });",
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      code: `import * as css from '@plumeria/core'; const styles = css.create({
          key1: {
            ...spread,
            display: "block",
            position: "absolute"
          }
        });`,
      errors: 1,
      output: `import * as css from '@plumeria/core'; const styles = css.create({
          key1: {
            ...spread,
            position: "absolute",
            display: "block"
          }
        });`,
      settings: {
        ecmaVersion: 2021,
      },
    },
    {
      // Spread at end in invalid
      code: 'import * as css from "@plumeria/core"; const styles = css.create({ key1: { display: "block", position: "absolute", ...s } });',
      errors: 1,
      output:
        'import * as css from "@plumeria/core"; const styles = css.create({ key1: { position: "absolute", display: "block", ...s } });',
      settings: {
        ecmaVersion: 2021,
      },
    },
  ],
});
