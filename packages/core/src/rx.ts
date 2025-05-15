export const rx = (
  className: string,
  varSet: { [key: `--${string}`]: string },
) => ({
  className,
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});
