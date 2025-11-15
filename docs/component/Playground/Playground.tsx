import { Sandpack } from '@codesandbox/sandpack-react';

export function Playground() {
  return (
    <div style={{ height: '100vh' }}>
      <Sandpack
        template="react"
        files={{
          '/pages/index.js': {
            code: `
import { css } from '@plumeria/core';

const styles = css.create({
  heading: {
    fontSize: '24px',
    color: 'navy',
    padding: 120,
  },
});

export default function Home() {
  return <div className={css.props(styles.heading)}>Hello World</div>
}`,
            active: true,
          },

          '/App.js': {
            code: `
import Home from './pages/index';
export default function App() {
  return <Home />
}`,
            hidden: true,
          },
        }}
        customSetup={{
          dependencies: {
            '@plumeria/core': 'latest',
            next: 'latest',
          },
        }}
        options={{
          showLineNumbers: true,
          showInlineErrors: true,
        }}
      />
    </div>
  );
}
