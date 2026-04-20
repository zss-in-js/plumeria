# @plumeria/core

![License](https://img.shields.io/badge/License-MIT-10B981?logo=opensourceinitiative&logoColor=black)
![npm](https://img.shields.io/npm/v/@plumeria/core?logo=npm&logoColor=white&color=6366F1)

![Web](https://img.shields.io/badge/Web-0B-10B981?logo=googlechrome&logoColor=white)
![Runtime](https://img.shields.io/badge/Runtime-none-10B981?logo=rocket&logoColor=white)
![Types](https://img.shields.io/badge/Types-100%25-6366F1?logo=typescript&logoColor=white)

**Plumeria** is a library for developing styled React components for the web. It is a compiler with typed syntax and linting support. The goal of Plumeria is to reduce the load on developers.

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
