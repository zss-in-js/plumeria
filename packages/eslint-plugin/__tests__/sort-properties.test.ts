import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { sortProperties } from '../src/rules/sort-properties';

const ruleTester = new RuleTester();

ruleTester.run(
  'sort-properties',
  sortProperties as unknown as JSRuleDefinition,
  {
    valid: [
      {
        code: 'const styles = { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" };',
        settings: {
          ecmaVersion: 2021,
        },
      },
    ],
    invalid: [
      {
        code: 'const styles = { display: "block", position: "absolute", top: "0", right: "0", bottom: "0", left: "0" };',
        errors: [
          {
            message: 'Property "display" should be at position 6',
          },
          {
            message: 'Property "position" should be at position 1',
          },
          {
            message: 'Property "top" should be at position 2',
          },
          {
            message: 'Property "right" should be at position 3',
          },
          {
            message: 'Property "bottom" should be at position 4',
          },
          {
            message: 'Property "left" should be at position 5',
          },
        ],
        output:
          'const styles = { position: "absolute", top: "0", right: "0", bottom: "0", left: "0", display: "block" };',
        settings: {
          ecmaVersion: 2021,
        },
      },
    ],
  },
);
