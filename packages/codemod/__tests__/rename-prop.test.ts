import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { renameProp } from '../src/transforms/rename-prop';

import type { Linter } from 'eslint';

const jsxTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

const tsTester = new RuleTester({
  languageOptions: {
    parser: tsParser as unknown as Linter.Parser,
  },
});

const options = [{ from: 'styleName', to: 'classStyle' }];

jsxTester.run('rename-prop (jsx)', renameProp, {
  valid: [
    {
      code: '<div classStyle={styles.text} />',
      options,
    },
    {
      code: '<div className="text" style={{ color: "red" }} />',
      options,
    },
    {
      // the prop is matched by name, so an already migrated file is a no-op
      code: '<div sx={styles.text} />',
      options,
    },
    {
      code: '<svg><use xlink:styleName="#icon" /></svg>',
      options,
    },
    {
      code: "const Card = (props) => <div classStyle={props['styleName']} />;",
      options,
    },
    {
      code: 'class Card { #styleName; get style() { return this.#styleName; } }',
      options,
    },
    {
      code: 'const { [styleName]: value } = props;',
      options,
    },
    {
      code: "const { 'styleName': value } = props;",
      options,
    },
  ],
  invalid: [
    {
      code: '<div styleName={styles.text} />',
      options,
      output: '<div classStyle={styles.text} />',
      errors: [{ messageId: 'rename' }],
    },
    {
      code: '<div styleName={styles.text} className="text" />',
      options,
      output: '<div classStyle={styles.text} className="text" />',
      errors: [{ messageId: 'rename' }],
    },
    {
      // several attributes in one file are all fixed in a single pass
      code: '<><div styleName={styles.a} /><span styleName={styles.b} /></>',
      options,
      output:
        '<><div classStyle={styles.a} /><span classStyle={styles.b} /></>',
      errors: [{ messageId: 'rename' }, { messageId: 'rename' }],
    },
    {
      // from/to are plain arguments, so any pair of names works
      code: '<div sx={styles.text} />',
      options: [{ from: 'sx', to: 'cx' }],
      output: '<div cx={styles.text} />',
      errors: [{ messageId: 'rename' }],
    },
    {
      // renaming onto a member expression is reported, not rewritten
      code: 'const Card = (props) => <div styleName={props.styleName} />;',
      options,
      output: 'const Card = (props) => <div classStyle={props.styleName} />;',
      errors: [{ messageId: 'rename' }, { messageId: 'manual' }],
    },
    {
      code: 'const Card = ({ styleName }) => <div styleName={styleName} />;',
      options,
      output: 'const Card = ({ styleName }) => <div classStyle={styleName} />;',
      errors: [{ messageId: 'manual' }, { messageId: 'rename' }],
    },
  ],
});

tsTester.run('rename-prop (types)', renameProp, {
  valid: [
    {
      // the key alone is not enough — an unrelated interface is left alone
      code: 'interface Row { styleName?: string }',
      options,
    },
    {
      code: 'interface Props { styleName?: Style }',
      options: [{ from: 'styleName', to: 'classStyle', includeTypes: false }],
    },
    {
      code: 'interface Props { classStyle?: Style }',
      options,
    },
    {
      code: 'interface Props { styleName }',
      options,
    },
  ],
  invalid: [
    {
      code: 'interface Props { styleName?: Style }',
      options,
      output: 'interface Props { classStyle?: Style }',
      errors: [{ messageId: 'rename' }],
    },
    {
      // the global augmentation in plumeria.d.ts
      code: 'declare global { namespace React { interface HTMLAttributes<T> { styleName?: Style } } }',
      options,
      output:
        'declare global { namespace React { interface HTMLAttributes<T> { classStyle?: Style } } }',
      errors: [{ messageId: 'rename' }],
    },
    {
      code: 'interface Props { styleName?: Style | undefined }',
      options,
      output: 'interface Props { classStyle?: Style | undefined }',
      errors: [{ messageId: 'rename' }],
    },
    {
      code: 'interface Props { styleName?: Plumeria.Style }',
      options,
      output: 'interface Props { classStyle?: Plumeria.Style }',
      errors: [{ messageId: 'rename' }],
    },
    {
      code: 'const { styleName } = props;',
      options,
      output: null,
      errors: [{ messageId: 'manual' }],
    },
  ],
});
