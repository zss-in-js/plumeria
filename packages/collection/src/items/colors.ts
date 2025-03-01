const parseAmountToPercentage = (amount: string | number): number => {
  if (typeof amount === 'string') {
    if (!amount.endsWith('%')) {
      throw new Error(
        `Invalid percentage format: ${amount} Expected a string ending with %`,
      );
    }
    const percentageAmount = parseFloat(amount.slice(0, -1));
    if (isNaN(percentageAmount)) {
      throw new Error(`Invalid number in percentage format: ${amount}`);
    }
    return percentageAmount;
  } else {
    return amount * 100;
  }
};

function darken(color: string, amount: string | number): string {
  const percentageAmount = parseAmountToPercentage(amount);
  return `color-mix(in srgb, ${color}, #000 ${percentageAmount}%)`;
}

function lighten(color: string, amount: string | number): string {
  const percentageAmount = parseAmountToPercentage(amount);
  return `color-mix(in srgb, ${color}, #fff ${percentageAmount}%)`;
}

export const colors = {
  darken,
  lighten,
};
