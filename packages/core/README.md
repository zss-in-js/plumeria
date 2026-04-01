# @plumeria/core
![license](https://img.shields.io/badge/license-MIT-blue)
![npm](https://img.shields.io/npm/v/@plumeria/core)

![web (prod/dev)](https://img.shields.io/badge/web%20(prod/dev)-0B-brightgreen)
![runtime](https://img.shields.io/badge/runtime-0B-brightgreen)
![type safe](https://img.shields.io/badge/types-100%25-brightgreen)

**Plumeria** is a library for developing styled React components for the web. It is a compiler with typed syntax and linting support. The goal of Plumeria is to reduce the load on developers.

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Example
Styles can be passed to the `styleName` prop. That prop accepts static and dynamic styles as an array.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12,
  },
  cond: {
    background: 'navy'
  },
  scale: (value) => ({
    scale: value
  })
});

export default function App(props) {
  const scale = useScale();
  return (
    <div
      {...props}
      styleName={[
        styles.text, 
        cond && styles.cond,
        styles.scale(scale)
      ]}
    />
  );
}
```

## License

Plumeria is MIT licensed.
