import style from '@plumeria/core';

const styles = style.create({
  test_server: {
    color: 'green',
  },
});

export const ServerComponent = () => {
  return (
    <p className={style.use(styles.test_server)} data-testid="e2e-test-p">
      ServerComponent
    </p>
  );
};
