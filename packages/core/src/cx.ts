const cx = (...classes: Array<string | null | undefined | false>): string =>
  classes.filter(Boolean).join(' ');

export default cx;
