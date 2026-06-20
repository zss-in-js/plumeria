# @plumeria/core

![License](https://img.shields.io/badge/License-MIT-10B981)
![npm](https://img.shields.io/npm/v/@plumeria/core?&color=10B981)

![Web](https://img.shields.io/badge/Web-atomic-6366F1?logo=npm&logoColor=white)
![Types](https://img.shields.io/badge/Types-100%25-6366F1?logo=npm&logoColor=white)
![Runtime](https://img.shields.io/badge/Runtime-never-6366F1?logo=npm&logoColor=white)

**Plumeria** is a **zero-cost abstraction layer** for styling React components without JavaScript. Its axioms are grounded in category theory, making it self-evident, predictable, and composable by construction. It enforces strict syntax and linting to reduce the cognitive overhead for engineers.

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Example
Styles can be passed to the `styleName` prop. That prop accepts static and dynamic styles as an array.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12
  },
  cond: {
    background: 'navy'
  },
  scale: (value) => ({
    scale: value
  })
});

export default function App({ cond }) {
  const scale = useScale();
  return (
    <div
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
