export const cx = (
  ...strings: Array<string | null | undefined | false>
): string & ':' => {
  let result = '';
  let isFirst = true;
  strings.filter(Boolean).forEach((str) => {
    if (str?.toString().startsWith(':')) {
      result += str.toString() as string & ':';
    } else if (typeof str === 'string') {
      if (isFirst) {
        result += str;
        isFirst = false;
      } else {
        result += ` ${str}`;
      }
    }
  });
  return result as string & ':';
};
