import css from '@plumeria/core';

const styles = css.create({
  small: {
    fontSize: '12px',
  },
  medium: {
    fontSize: '16px',
  },
  large: {
    fontSize: '20px',
  },
  primary: {
    color: 'blue',
  },
  secondary: {
    color: 'gray',
  },
});
const variants = css.variants({
  size: {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  },
  colorPick: {
    primary: styles.primary,
    secondary: styles.secondary,
  },
});

export function VariantTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Variants Staticization Test</h3>
      <div
        data-testid="variant-div-1"
        className={css.use(variants({ size: 'small', colorPick: 'primary' }))}
      >
        Small Primary Variant
      </div>
      <div
        data-testid="variant-div-2"
        className={css.use(variants({ size: 'large', colorPick: 'secondary' }))}
      >
        Large Secondary Variant
      </div>
    </div>
  );
}
