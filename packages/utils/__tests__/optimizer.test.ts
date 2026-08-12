import { optimizer } from '../src/optimizer';

describe('optimizer', () => {
  it('merges identical selectors and at-rules', async () => {
    const result = await optimizer(
      '@container (min-width:400px){.a{color:red}}' +
        '.base{color:black}' +
        '@container (min-width:400px){.a{display:block}.b{color:blue}}',
    );

    expect(result.match(/@container/g)).toHaveLength(1);
    expect(result.match(/\.a\s*\{/g)).toHaveLength(1);
    expect(result).toContain('color: red');
    expect(result).toContain('display: block');
  });
});
