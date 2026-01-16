import { getStyleRecords } from '../src/create';

describe('getStyleRecords', () => {
  it('should generate atomic records for simple properties', () => {
    const result = getStyleRecords('test', { color: 'red' });

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('color');
    // hash depends on zss-engine implementation, checking format or presence
    expect(result[0].hash).toBeDefined();
    // sheet should contain the declaration
    expect(result[0].sheet).toMatch(/color:\s*red/);
  });

  it('should generate multiple records for multiple properties', () => {
    const result = getStyleRecords('test', { color: 'red', fontSize: '16px' });

    expect(result).toHaveLength(2);
    const keys = result.map((r) => r.key).sort();
    expect(keys).toEqual(['color', 'fontSize']);
  });

  it('should handle nested pseudo-classes', () => {
    const result = getStyleRecords('test', {
      '&:hover': { color: 'blue' },
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].key).toContain('&:hover'); // key usually includes selector info for nested
    expect(result[0].sheet).toMatch(/color:\s*blue/);
    expect(result[0].sheet).toContain(':hover');
  });

  it('should handle @media queries', () => {
    const result = getStyleRecords('test', {
      '@media (min-width: 500px)': {
        color: 'green',
      },
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('@media (min-width: 500px):color');
    expect(result[0].sheet).toContain('@media (min-width: 500px)');
    expect(result[0].sheet).toMatch(/color:\s*green/);
  });

  it('should handle complex nested styles', () => {
    const result = getStyleRecords('test', {
      color: 'red',
      '&:hover': {
        background: 'white',
        '@media (max-width: 400px)': {
          background: 'gray',
        },
      },
    } as any);

    // 1 atomic (color) + 1 nested (hover background) + 1 nested media (hover media background)
    expect(result.length).toBeGreaterThanOrEqual(2);

    const sheetContent = result.map((r) => r.sheet).join('\n');
    expect(sheetContent).toMatch(/color:\s*red/);
    expect(sheetContent).toMatch(/background:\s*white/);
    expect(sheetContent).toContain(':hover');
  });
  it('should handle non-atomic descendent selectors', () => {
    const result = getStyleRecords('test', {
      '& span': { color: 'red' },
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].key).toContain('& span');
    expect(result[0].sheet).toMatch(/span/);
    expect(result[0].sheet).toMatch(/color:\s*red/);
  });

  it('should handle non-atomic selectors inside queries', () => {
    const result = getStyleRecords('test', {
      '@media (min-width: 100px)': {
        '& div': { color: 'blue' },
      },
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].key).toContain('@media');
    expect(result[0].key).toContain('& div');
    expect(result[0].sheet).toContain('@media (min-width: 100px)');
    expect(result[0].sheet).toContain('div');
    expect(result[0].sheet).toMatch(/color:\s*blue/);
  });

  it('should handle atomic selectors inside queries', () => {
    const result = getStyleRecords('test', {
      '@media (min-width: 100px)': {
        '&:hover': { color: 'green' },
      },
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].key).toContain('@media');
    expect(result[0].key).toContain('&:hover');
    expect(result[0].sheet).toContain('@media (min-width: 100px)');
    expect(result[0].sheet).toContain(':hover');
    expect(result[0].sheet).toMatch(/color:\s*green/);
  });
});
