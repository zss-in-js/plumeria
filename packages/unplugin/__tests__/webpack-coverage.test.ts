import webpack, { attachWebpackHooks } from '../src/webpack';

const ABSOLUTE_CSS = '/project/Card.zero.css';
const VIRTUAL_CSS = '/Card.zero.css';

const createBase = () => ({
  name: 'base',
  __plumeriaInternal: {
    cssFileLookup: new Map([[VIRTUAL_CSS, ABSOLUTE_CSS]]),
    cssLookup: new Map([[ABSOLUTE_CSS, '.card {}']]),
    targets: [{ id: '/project/Card.tsx', dependencies: [] }],
    setDev: jest.fn(),
    setRoot: jest.fn(),
    setCssImport: jest.fn(),
  },
  transform: jest.fn(async (code: string) => {
    if (code === 'null') return null;
    if (code === 'plain') return { code: 'plain' };
    return { code: `import "${VIRTUAL_CSS}";` };
  }),
});

const compilerWith = (rules: unknown, mode = 'development') => ({
  isChild: () => false,
  context: '/project',
  options: { mode, module: { rules } },
});

it('imports the stylesheet by a relative path with a cache-busting query', async () => {
  const base = createBase();
  const plugin = attachWebpackHooks(base) as any;

  const [cssImport] = base.__plumeriaInternal.setCssImport.mock.calls[0];

  expect(
    cssImport({
      id: '/project/Card.tsx',
      cssId: VIRTUAL_CSS,
      cssFilename: ABSOLUTE_CSS,
      css: '.card {}',
    }),
  ).toMatch(/^\nimport "\.\/Card\.zero\.css\?t=\d+";$/);

  expect(
    cssImport({
      id: '/project/src/Card.tsx',
      cssId: VIRTUAL_CSS,
      cssFilename: ABSOLUTE_CSS,
      css: '.card {}',
    }),
  ).toMatch(/^\nimport "\.\.\/Card\.zero\.css\?t=\d+";$/);

  await expect(
    plugin.transform('null', '/project/Card.tsx'),
  ).resolves.toBeNull();
  await expect(plugin.transform('plain', '/project/Card.tsx')).resolves.toEqual(
    { code: 'plain' },
  );
});

it('covers unresolved ids and queried absolute ids', () => {
  const plugin = attachWebpackHooks(createBase()) as any;

  expect(plugin.resolveId(`${ABSOLUTE_CSS}?direct`)).toBe(
    `${ABSOLUTE_CSS}?direct`,
  );
  expect(plugin.resolveId('Card.zero.css')).toBeNull();
  expect(plugin.resolveId('/project/source.ts')).toBeNull();
});

it('loads CSS with and without a matching source target', () => {
  const plugin = attachWebpackHooks(createBase()) as any;

  expect(plugin.load.call({}, ABSOLUTE_CSS)).toEqual({
    code: '.card {}',
    moduleType: 'css',
  });
  plugin.__plumeriaInternal.targets.length = 0;
  expect(plugin.load.call({ addDependency: jest.fn() }, ABSOLUTE_CSS)).toEqual({
    code: '.card {}',
    moduleType: 'css',
  });
});

it('configures root without enabling development for production compilers', () => {
  const base = createBase();
  const plugin = attachWebpackHooks(base) as any;

  plugin.webpack(compilerWith(undefined, 'production'));

  expect(base.__plumeriaInternal.setRoot).toHaveBeenCalledWith('/project');
  expect(base.__plumeriaInternal.setDev).not.toHaveBeenCalled();
});

it('adapts a matching JavaScript rule when no CSS rule exists', () => {
  const originalInclude = jest.fn((id: string) => !id.includes('blocked'));
  const sourceRule = {
    type: 'javascript/auto',
    enforce: 'pre',
    include: originalInclude,
    use: [null, {}, { loader: '/unplugin/load.mjs' }],
  };
  const rules: any[] = [null, { type: 'other', use: [] }, sourceRule];

  (attachWebpackHooks(createBase()) as any).rspack(compilerWith(rules));

  expect(rules).toHaveLength(4);
  expect(sourceRule.include('/project/Card.zero.css')).toBe(false);
  expect(sourceRule.include('/project/Card.tsx')).toBe(true);
  expect(rules[0].include('/project/Card.tsx')).toBe(false);
  expect(rules[0].include('/project/Card.zero.css')).toBe(true);
  expect(rules[0].include('/blocked.zero.css')).toBe(false);
});

it('adapts a JavaScript rule without an include callback', () => {
  const sourceRule: any = {
    type: 'javascript/auto',
    use: [{ loader: '/unplugin/load.mjs' }],
  };
  const rules = [sourceRule];

  (attachWebpackHooks(createBase()) as any).webpack(compilerWith(rules));

  expect(sourceRule.include('/project/Card.tsx')).toBe(true);
  expect(rules[0].include('/project/Card.zero.css')).toBe(true);
});

it('creates the default webpack adapter', () => {
  expect(webpack()).toBeDefined();
});
