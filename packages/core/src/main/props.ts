import type { CSSProperties } from 'zss-engine';
import { objectToKeyHashMap } from './create';

const props = (
  ...objects: (false | Readonly<CSSProperties> | null | undefined)[]
): string => {
  const classNames = objects.filter(Boolean).map((obj) => {
    if (obj && typeof obj === 'object') {
      const keyHash = objectToKeyHashMap.get(obj);
      if (keyHash) return keyHash;
    }
    return '';
  });

  return [...new Set(classNames)].join(' ');
};

export default props;
