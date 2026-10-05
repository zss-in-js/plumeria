# @plumeria/swc-jest

Jest transformer for Plumeria.  
It compiles the styling prop away, then hands the file to [`@swc/jest`](https://www.npmjs.com/package/@swc/jest), so components render in a test with the class names the build gives them.

## Installation

```bash
npm install -D @plumeria/swc-jest @swc/core
# or
yarn add -D @plumeria/swc-jest @swc/core
# or
pnpm add -D @plumeria/swc-jest @swc/core
```

## How to Use

Put it where `@swc/jest` was. Jest runs one transformer per pattern, so it replaces the entry rather than sitting beside it:

```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': '@plumeria/swc-jest',
  },
};
```

SWC is configured as before: from `.swcrc`, or from the options next to the transformer.

## Options

```js
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@plumeria/swc-jest',
      {
        styleProp: 'sx',
        jsc: { transform: { react: { runtime: 'automatic' } } },
      },
    ],
  },
};
```

| Option | Default | Description |
| :-- | :-- | :-- |
| `styleProp` | `'classStyle'` | The JSX prop that carries styles. |
| `withoutLogicalProperties` | `false` | Reject the logical name of a property that also has a physical name. Takes `true` or `{ sizes?: boolean }`. |
| `withoutPhysicalProperties` | `false` | Reject the physical name of a property that also has a logical name. Takes `true` or `{ sizes?: boolean }`. |

Every other key is passed to `@swc/jest` unchanged. Keep these three the same as in the bundler config.

## Do

Assert what the component does. The class names are real, so a branch that picks a different style shows up as a different `className`:

```tsx
test('the active tab is styled apart from the rest', () => {
  render(<Tabs active="b" />);

  const a = screen.getByRole('tab', { name: 'A' });
  const b = screen.getByRole('tab', { name: 'B' });

  expect(b.getAttribute('aria-selected')).toBe('true');
  expect(b.className).not.toBe(a.className);
});
```

- Test text, roles, state and events, as you would without Plumeria.
- Compare class names between two renders or two elements to check a conditional style took effect.
- Import styles from other files freely. They compile as in the build, and Jest's cache follows them: change a shared style and the files that use it are compiled again.

## Don't

```tsx
expect(button.className).toBe('xqqbxt1d xq96bg3w'); // don't
expect(getComputedStyle(button).color).toBe('red'); // don't
```

- Don't hard-code a generated class name. Each one is a hashed property–value pair, so adding a property to the style breaks the test without anything being wrong.
- Don't assert computed styles. jsdom applies no stylesheet, and none is written: `getComputedStyle` returns initial values. Check the cascade, `@media` and pseudo-classes in a real browser.
- Don't list it beside `@swc/jest`, `ts-jest` or `babel-jest` for the same files. Only one transformer runs per pattern.
- Don't rely on the test run for type checking. SWC strips types; run `tsc` for that.
- Don't use it to test what a style compiles to. Call the transform directly for that; see [Driving the transform](https://plumeria.dev/docs/api-reference/plugins/unplugin#driving-the-transform).

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
