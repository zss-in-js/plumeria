import { css } from '@plumeria/core';

const styles = css.create({
  test_server: {
    color: 'green',
  },
});

export const ServerComponent = () => {
  return (
    <p className={css.props(styles.test_server)} data-testid="e2e-test-p">
      ServerComponent
    </p>
  );
};
