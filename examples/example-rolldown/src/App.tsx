import * as css from '@plumeria/core';

const styles = css.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export const App = () => {
  return (
    <div styleName={styles.container}>
      <h1 styleName={styles.text}>Hello from Plumeria + Esbuild!</h1>
    </div>
  );
};
