import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { sortProperties } from '../../src/rules/sort-properties';

const ruleTester = new RuleTester();

ruleTester.run(
  'sort-properties',
  sortProperties as unknown as JSRuleDefinition,
  {
    valid: [
      {
        code: 'const styles = { key1: { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" } };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: 'const styles = { ...x, b: 1, a: 2 };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: 'const styles = { z: 1, a: 2 };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: "const styles = { color: 'red', position: 'absolute' };",
        settings: { ecmaVersion: 2021 },
      },
      {
        code: 'const styles = { ":hover": { color: \'blue\'}, "&": { color: \'red\'} };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: 'const styles = { key1: { display: "block", ":hover": { color: "red" } } };',
        settings: { ecmaVersion: 2021 },
      },
    ],
    invalid: [
      {
        code: 'const styles = { key1: { display: "block", position: "absolute", top: "0", right: "0", bottom: "0", left: "0" } };',
        errors: 6,
        output:
          'const styles = { key1: { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" } };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: 'const styles = { key1: {\n  left: 0,\n  position: "absolute"\n} };',
        errors: 2,
        output:
          'const styles = { key1: {\n  position: "absolute",\n  left: 0\n} };',
        settings: { ecmaVersion: 2021 },
      },
      {
        code: "const styles = { key1: { '@media (min-width: 1024px)': { color: 'purple' }, '&:hover': { color: 'red' }, '&': { color: 'blue' } } };",
        errors: 3,
        output:
          "const styles = { key1: { '&:hover': { color: 'red' }, '&': { color: 'blue' }, '@media (min-width: 1024px)': { color: 'purple' } } };",
        settings: { ecmaVersion: 2021 },
      },
      {
        code: "const key = 'z'; const styles = { key1: { [key]: 'value', display: 'block' } };",
        errors: 2,
        output:
          "const key = 'z'; const styles = { key1: { display: 'block', [key]: 'value' } };",
        settings: { ecmaVersion: 2021 },
      },
      {
        code: "const styles = { key1: { '@container (min-width: 1024px)': { color: 'purple' }, '&:hover': { color: 'red' } } };",
        errors: 2,
        output:
          "const styles = { key1: { '&:hover': { color: 'red' }, '@container (min-width: 1024px)': { color: 'purple' } } };",
        settings: { ecmaVersion: 2021 },
      },
      {
        code: "const styles = { key1: { [`z-prop`]: 'value', display: 'block' } };",
        errors: 2,
        output:
          "const styles = { key1: { display: 'block', [`z-prop`]: 'value' } };",
        settings: { ecmaVersion: 2021 },
      },
    ],
  },
);
