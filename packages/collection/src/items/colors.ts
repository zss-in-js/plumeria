function darken(color: string, amount: string | number): string {
  let percentageAmount: number;

  if (typeof amount === 'string') {
    if (!amount.endsWith('%')) {
      throw new Error('Invalid percentage format. Use "20%"');
    }
    percentageAmount = parseFloat(amount.slice(0, -1));
    if (isNaN(percentageAmount)) {
      throw new Error('Invalid number in percentage format.');
    }
  } else {
    percentageAmount = amount * 100;
  }

  return `color-mix(in srgb, ${color}, #000 ${percentageAmount}%)`;
}

function lighten(color: string, amount: string | number): string {
  let percentageAmount: number;

  if (typeof amount === 'string') {
    if (!amount.endsWith('%')) {
      throw new Error('Invalid percentage format. Use "20%"');
    }
    percentageAmount = parseFloat(amount.slice(0, -1));
    if (isNaN(percentageAmount)) {
      throw new Error('Invalid number in percentage format.');
    }
  } else {
    percentageAmount = amount * 100;
  }

  return `color-mix(in srgb, ${color}, #fff ${percentageAmount}%)`;
}

export const colors = {
  darken,
  lighten,
};
