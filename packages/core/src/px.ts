import { Join } from 'zss-engine';

const px = <T extends readonly string[]>(...pseudos: T): Join<T> => {
  return pseudos.filter(Boolean).join('') as Join<T>;
};

export default px;
