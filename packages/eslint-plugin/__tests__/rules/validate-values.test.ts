import type { JSRuleDefinition } from 'eslint';
import { RuleTester } from 'eslint';
import { validateValues } from '../../src/rules/validate-values';

const ruleTester = new RuleTester();

ruleTester.run(
  'validate-values',
  validateValues as unknown as JSRuleDefinition,
  {
    valid: [
      // Basic keywords
      { code: "const styles = { position: 'absolute' };" },
      { code: "const styles = { display: 'flex' };" },
      { code: "const styles = { overflow: 'scroll auto' };" },

      // Length & Color
      { code: "const styles = { fontSize: '1.5em' };" },
      { code: "const styles = { color: '#f00' };" },
      { code: "const styles = { borderColor: 'red blue' };" },
      { code: "const styles = { margin: '10px 20px' };" },

      // Shorthand & Complex
      { code: "const styles = { border: '1px solid red' };" },
      { code: "const styles = { background: 'red' };" },
      { code: "const styles = { filter: 'blur(5px)' };" },
      { code: "const styles = { transition: 'width 2s ease-in-out' };" },
      { code: "const styles = { flex: '1 1 auto' };" },
      { code: "const styles = { flexFlow: 'row wrap' };" },
      { code: "const styles = { animation: 'slidein 3s ease' };" },
      { code: "const styles = { grid: '1fr / 1fr' };" },
      { code: "const styles = { transform: 'translateX(10px)' };" },
      {
        code: "const styles = { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };",
      },
      { code: "const styles = { cursor: 'url(hand.cur), auto' };" },
      { code: "const styles = { fontVariant: 'small-caps' };" },

      // Global values & CSS Vars
      { code: "const styles = { color: 'inherit' };" },
      { code: "const styles = { color: 'var(--my-color)' };" },
    ],

    invalid: [
      {
        code: "const styles = { position: 'center' };",
        errors: [
          {
            message:
              "'position' has an invalid value 'center'. Valid values: static, relative, absolute, fixed, sticky",
          },
        ],
      },
      {
        code: "const styles = { zIndex: 'high' };",
        errors: [
          {
            message: "'zIndex' has an invalid value 'high'. Valid values: auto",
          },
        ],
      },
      {
        code: "const styles = { display: 'foo' };",
        errors: [
          {
            message:
              "'display' has an invalid value 'foo'. Valid values: block, inline, run-in, flow, flow-root, table, flex, grid, ruby, math, table-header-group, table-footer-group, table-row, table-row-group, table-cell, table-column-group, table-column, table-caption, ruby-base, ruby-text, ruby-base-container, ruby-text-container, contents, none, inline-block, inline-table, inline-flex, inline-grid, inline-list-item",
          },
        ],
      },
      {
        code: "const styles = { color: 'invalid-color' };",
        errors: [
          {
            message:
              "'color' has an invalid value 'invalid-color'. Valid values: ",
          },
        ],
      },
      {
        code: "const styles = { margin: '10px 20px 30px 40px 50px' };",
        errors: [
          {
            message:
              "'margin' has an invalid value '10px 20px 30px 40px 50px'. Valid values: auto",
          },
        ],
      },
      {
        code: "const styles = { border: '1px solid red blue' };",
        errors: [
          {
            message:
              "'border' has an invalid value '1px solid red blue'. Valid values: thin, medium, thick, none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset",
          },
        ],
      },
      {
        code: "const styles = { background: 'url(/foo.png) no-repeat extra' };",
        errors: [
          {
            message:
              "'background' has an invalid value 'url(/foo.png) no-repeat extra'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { flex: '1 1 auto 0' };",
        errors: [
          {
            message:
              "'flex' has an invalid value '1 1 auto 0'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { transform: 'translateX(10px) wrong' };",
        errors: [
          {
            message:
              "'transform' has an invalid value 'translateX(10px) wrong'. Valid values: none",
          },
        ],
      },
      {
        code: "const styles = { cursor: 'url(hand.cur), auto, pointer' };",
        errors: [
          {
            message:
              "'cursor' has an invalid value 'url(hand.cur), auto, pointer'. Valid values: auto",
          },
        ],
      },
    ],
  },
);
