import * as css from '@plumeria/core';

const sizeStyles = css.create({
  small: {
    fontSize: '12px',
  },
  medium: {
    fontSize: '16px',
  },
  large: {
    fontSize: '20px',
  },
});

const colorStyles = css.create({
  primary: {
    color: 'blue',
  },
  secondary: {
    color: 'gray',
  },
});

const s = css.create({
  p1: {
    color: 'green',
  },
  p2: {
    color: 'purple',
  },
});

export function VariantTest() {
  const size1 = 'small';
  const color1 = 'primary';
  const size2 = 'large';
  const color2 = 'secondary';

  const v1 = 'p1';
  const v2 = 'p2';
  const myStyles = s[v1];

  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Variants Staticization Test</h3>
      <div
        data-testid="variant-div-1"
        styleName={[sizeStyles[size1], colorStyles[color1]]}
      >
        Small Primary Variant
      </div>
      <div
        data-testid="variant-div-2"
        styleName={[sizeStyles[size2], colorStyles[color2]]}
      >
        Large Secondary Variant
      </div>
      <div
        data-testid="bracket-div-1"
        styleName={s[v1]}
      >
        Bracket p1
      </div>
      <div
        data-testid="bracket-div-2"
        styleName={s[v2]}
      >
        Bracket p2
      </div>
      <div
        data-testid="bracket-div-3"
        styleName={myStyles}
      >
        Bracket p1 (indirect)
      </div>
    </div>
  );
}
