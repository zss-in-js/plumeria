const cx = (...classes: Array<string | null | undefined | false>): string =>
  [...new Set(classes.filter(Boolean))].join(' ');

export default cx;
