import { parseSync } from '@swc/core';
import { collectReferenceIdentifiers } from '../src/references';

const collect = (source: string) => {
  const ast = parseSync(source, { syntax: 'typescript', tsx: true });
  const result = collectReferenceIdentifiers(ast);
  const nameAt = (start: number) => source.slice(start - 1).match(/^\w+/)?.[0];
  return {
    references: [...result.references].map(nameAt),
    shorthands: [...result.shorthands].map(nameAt),
  };
};

describe('collectReferenceIdentifiers', () => {
  it('collects expressions while excluding declarations and property names', () => {
    const result = collect(`
      import local, { remote as alias } from 'pkg';
      export { alias as exported };
      const value = dependency;
      const object = { key: value, value, [computed]: member.property };
      label: for (;;) { if (stop) break label; continue label; }
    `);

    expect(result.references).toEqual(
      expect.arrayContaining([
        'dependency',
        'value',
        'computed',
        'member',
        'stop',
      ]),
    );
    for (const name of [
      'local',
      'remote',
      'alias',
      'exported',
      'key',
      'property',
      'label',
    ])
      expect(result.references).not.toContain(name);
    expect(result.shorthands).toEqual(['value']);
  });

  it('honors function parameters, defaults, and hoisted declarations', () => {
    const result = collect(`
      const result = function named(
        plain = defaultValue,
        { key: alias = aliasDefault, shorthand, ...rest },
        [item, , ...items]
      ) {
        beforeVar;
        beforeFunction;
        { var beforeVar = localValue; function beforeFunction() {} }
        const nested = () => nestedExternal;
        return { named, plain, alias, shorthand, rest, item, items, external };
      };
    `);

    expect(result.references).toEqual(
      expect.arrayContaining([
        'defaultValue',
        'aliasDefault',
        'localValue',
        'nestedExternal',
        'external',
      ]),
    );
    for (const name of [
      'named',
      'plain',
      'alias',
      'shorthand',
      'rest',
      'item',
      'items',
      'beforeVar',
      'beforeFunction',
    ])
      expect(result.references).not.toContain(name);
  });

  it('applies lexical scopes to blocks, switches, catches, and loops', () => {
    const result = collect(`
      {
        blockLocal;
        let blockLocal = blockInit;
      }
      switch (subject) {
        case caseValue: let switched = switchInit; use(switched); break;
        default: use(switched);
      }
      try { risky(); } catch ({ message = messageDefault }) { use(message); }
      for (let index = start; index < end; index++) use(index);
      for (const key in object) use(key);
      for (const value of values) use(value);
    `);

    expect(result.references).toEqual(
      expect.arrayContaining([
        'blockInit',
        'subject',
        'caseValue',
        'switchInit',
        'use',
        'messageDefault',
        'risky',
        'start',
        'end',
        'object',
        'values',
      ]),
    );
    for (const name of [
      'blockLocal',
      'switched',
      'message',
      'index',
      'key',
      'value',
    ])
      expect(result.references).not.toContain(name);
  });

  it('handles class, JSX, computed, and TypeScript value positions', () => {
    const result = collect(`
      const C = class Inner extends Base {
        [methodName]() { return Inner; }
        field = fieldValue;
      };
      const Anonymous = class extends AnonymousBase {};
      class Declared extends Other { method() { return classValue; } }
      const element = <UI.Item attr={attributeValue}>{childValue}</UI.Item>;
      const asserted = expression as TypeName;
      const satisfied = expression satisfies TypeName;
      const nonNull = expression!;
      const instantiated = generic<TypeName>;
      enum Choice { A = enumValue }
    `);

    expect(result.references).toEqual(
      expect.arrayContaining([
        'Base',
        'methodName',
        'fieldValue',
        'AnonymousBase',
        'Other',
        'classValue',
        'attributeValue',
        'childValue',
        'expression',
        'generic',
        'enumValue',
      ]),
    );
    for (const name of [
      'Inner',
      'UI',
      'Item',
      'attr',
      'TypeName',
      'Choice',
      'A',
    ])
      expect(result.references).not.toContain(name);
  });

  it('walks namespace blocks and computed destructuring defaults', () => {
    const result = collect(`
      namespace Scope {
        export const local = initializer;
        use(local);
      }
      const { [computedKey]: local = defaultValue } = source;
    `);

    expect(result.references).toEqual(
      expect.arrayContaining([
        'initializer',
        'use',
        'computedKey',
        'defaultValue',
        'source',
      ]),
    );
    expect(result.references).not.toContain('local');
  });

  it('tolerates incomplete pattern properties and statement lists', () => {
    const ast = parseSync(
      `function fn({ ...rest }) { switch (value) { default: break; } }`,
      { syntax: 'typescript' },
    );
    const fn = ast.body[0] as any;
    fn.params[0].pat.properties.push(null);
    fn.body.stmts[0].cases[0].consequent.push(null);

    expect(() => collectReferenceIdentifiers(ast)).not.toThrow();
  });
});
