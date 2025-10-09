import { rx } from '../../src/api/rx';

describe('rx', () => {
  it('should return an object with the given className and varSet as style', () => {
    const className = 'my-class';
    const varSet = {
      '--primary-color': 'blue',
      '--font-weight': 'bold',
    };

    const result = rx(className, varSet);

    expect(result).toEqual({
      className: className,
      style: varSet,
    });
  });
});
