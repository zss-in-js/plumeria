import { create, styleAtomMap } from '../../src/api/create';

describe('create', () => {
  it('should return the input object correctly', () => {
    const styleObject = {
      button: {
        color: 'red',
      },
    };

    const styles = create(styleObject);
    expect(styles.button.color).toBe(styleObject.button.color);
  });

  it('should process atomic properties and update styleAtomMap', () => {
    const styleObject = {
      atomic: {
        fontSize: '16px',
        color: 'blue',
      },
    };

    create(styleObject);
    const records = styleAtomMap.get(styleObject.atomic);

    expect(records).toBeDefined();
    expect(records).toHaveLength(2);
  });

  it('should handle nested properties like pseudos', () => {
    const styleObject = {
      nested: {
        color: 'green',
        ':hover': {
          color: 'darkgreen',
        },
      },
    };

    create(styleObject);
    const records = styleAtomMap.get(styleObject.nested);

    expect(records).toBeDefined();
    // Expecting one for the base color and one for the hover state
    expect(records?.some((r) => r.key === 'color')).toBeTruthy();
    expect(records?.some((r) => r.key.includes(':hover'))).toBeTruthy();
  });

  it('should handle media queries', () => {
    const styleObject = {
      withMedia: {
        color: 'purple',
        '@media (min-width: 600px)': {
          color: 'rebeccapurple',
        },
      },
    };

    create(styleObject);
    const records = styleAtomMap.get(styleObject.withMedia);

    expect(records).toBeDefined();
    expect(records?.some((r) => r.key === 'color')).toBeTruthy();
    expect(records?.some((r) => r.key.includes('__queries__'))).toBeTruthy();
  });

  it('should return a frozen object', () => {
    const styleObject = {
      frozen: {
        opacity: 1,
      },
    };

    const styles = create(styleObject);
    expect(Object.isFrozen(styles)).toBe(true);
  });

  it('should handle shorthand/longhand ordering within an object', () => {
    // Case 1: Shorthand follows longhand (longhand should be removed)
    const shorthandAfter = {
      paddingTop: 10,
      padding: 20,
    };
    create({ shorthandAfter });
    const records1 = styleAtomMap.get(shorthandAfter);
    expect(records1).toHaveLength(1);
    expect(records1?.[0].key).toBe('padding');

    // Case 2: Longhand follows shorthand (both should be kept)
    const longhandAfter = {
      padding: 20,
      paddingTop: 10,
    };
    create({ longhandAfter });
    const records2 = styleAtomMap.get(longhandAfter);
    expect(records2).toHaveLength(2);
    expect(records2?.some((r) => r.key === 'padding')).toBeTruthy();
    expect(records2?.some((r) => r.key === 'paddingTop')).toBeTruthy();
  });
});
